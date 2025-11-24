import { createContext, useContext, useEffect, useState } from 'react'
/* eslint-disable react-refresh/only-export-components */
import { supabase, getUserProfileWithRole } from '../lib/supabase'
import { authService } from '../lib/api'
import { ROLES } from '../lib/constants'
import { addRecentProfile } from '../lib/recentProfiles'
import logger from '../lib/logger'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Constantes pour la gestion de session
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000 // Rafraîchir si expiration dans moins de 5 minutes
const AUTH_LOADING_TIMEOUT = 3000 // 3 secondes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fonction helper pour réinitialiser l'état utilisateur
  const resetUserState = () => {
    setUser(null)
    setRole(null)
    setProfile(null)
  }

  useEffect(() => {
    let mounted = true
    let subscription = null
    let timeoutId = null
    let sessionLoaded = false

    // Timeout de sécurité pour éviter le blocage
    timeoutId = setTimeout(() => {
      if (mounted && !sessionLoaded) {
        logger.warn('Auth loading timeout - forcing loading to false', {
          hasUser: !!user,
          hasRole: !!role,
          hasProfile: !!profile
        })
        setLoading(false)
      }
    }, AUTH_LOADING_TIMEOUT)

    // Fonction optimisée pour charger le profil utilisateur (une seule requête)
    const loadUserProfile = async (userId) => {
      if (!userId) return { role: null, profile: null }
      
      try {
        // Utiliser getUserProfileWithRole pour une seule requête au lieu de deux
        return await getUserProfileWithRole(userId)
      } catch (error) {
        logger.error('Error loading user profile', error, { userId })
        return { role: null, profile: null }
      }
    }

    // Vérifier la session actuelle avec retry automatique
    authService.getSession()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return
        
        try {
          if (error) {
            logger.error('Session error', error)
            throw error
          }
          
          setUser(session?.user ?? null)
          if (session?.user) {
            const { role: userRole, profile: userProfile } = await loadUserProfile(session.user.id)
            if (mounted) {
              setRole(userRole)
              setProfile(userProfile)
              // Si le rôle est null mais que l'utilisateur existe, logger un avertissement
              if (!userRole) {
                logger.warn('User exists but role is null after loading', {
                  userId: session.user.id,
                  email: session.user.email
                })
              }
            }
          } else {
            if (mounted) {
              setRole(null)
              setProfile(null)
            }
          }
        } catch (error) {
          logger.error('Error in getSession', error)
          if (mounted) {
            setUser(null)
            setRole(null)
            setProfile(null)
          }
        } finally {
          if (mounted) {
            sessionLoaded = true
            clearTimeout(timeoutId)
            setLoading(false)
          }
        }
      })
      .catch((error) => {
        logger.error('Error fetching session', error)
        if (mounted) {
          sessionLoaded = true
          clearTimeout(timeoutId)
          setUser(null)
          setRole(null)
          setProfile(null)
          setLoading(false)
        }
      })

    // Écouter les changements d'authentification (seulement après le chargement initial)
    try {
      let lastUserId = null // Pour éviter les chargements redondants
      const { data: { subscription: sub } } = authService.onAuthStateChange(async (event, session) => {
        if (!mounted) return
        
        // Ignorer le premier événement (déjà géré par getSession)
        if (!sessionLoaded) return
        
        // Éviter les chargements redondants si l'utilisateur n'a pas changé
        const currentUserId = session?.user?.id
        if (currentUserId === lastUserId && event !== 'SIGNED_OUT') {
          logger.debug('Skipping redundant auth state change', { event, userId: currentUserId })
          return
        }
        lastUserId = currentUserId
        
        try {
          setUser(session?.user ?? null)
          if (session?.user) {
            // Charger le profil seulement si nécessaire (éviter le double chargement après signIn)
            if (role === null || profile === null || user?.id !== session.user.id) {
              const { role: userRole, profile: userProfile } = await loadUserProfile(session.user.id)
              if (mounted) {
                setRole(userRole)
                setProfile(userProfile)
              }
            }
          } else {
            if (mounted) {
              setRole(null)
              setProfile(null)
              lastUserId = null
            }
          }
        } catch (error) {
          logger.error('Error in onAuthStateChange', error)
          if (mounted) {
            setUser(null)
            setRole(null)
            setProfile(null)
            lastUserId = null
          }
        }
      })
      subscription = sub
    } catch (error) {
      logger.error('Error setting up auth listener', error)
    }

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      if (subscription) {
        subscription.unsubscribe()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user?.id) return
    import('../services/prefetchService')
      .then(({ prefetchCriticalData }) => prefetchCriticalData())
      .catch(() => {})
  }, [user?.id])

  // Vérifier périodiquement si la session est toujours valide
  useEffect(() => {
    if (!user) return

    const checkSessionValidity = async () => {
      try {
        const { data: { session }, error } = await authService.getSession()
        
        // Gérer les erreurs de session
        if (error) {
          logger.error('Error checking session validity', error)
          try {
            await authService.signOut()
          } catch (signOutError) {
            logger.error('Error during sign out', signOutError)
          }
          resetUserState()
          return
        }

        // Vérifier si la session existe
        if (!session || !session.user) {
          logger.info('Session expired or invalid, signing out')
          try {
            await authService.signOut()
          } catch (signOutError) {
            logger.error('Error during sign out', signOutError)
          }
          resetUserState()
          return
        }

        // Vérifier l'expiration du token (expires_at est en secondes)
        if (session.expires_at) {
          const expiresAt = session.expires_at * 1000 // Convertir en millisecondes
          const now = Date.now()
          const timeUntilExpiry = expiresAt - now

          // Rafraîchir la session si elle expire bientôt
          if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
            logger.debug('Session expiring soon, attempting refresh')
            try {
              const { data: refreshData, error: refreshError } = await authService.refreshSession()
              
              if (refreshError || !refreshData.session) {
                logger.warn('Failed to refresh session', refreshError)
                try {
                  await authService.signOut()
                } catch (signOutError) {
                  logger.error('Error during sign out', signOutError)
                }
                resetUserState()
              }
            } catch (refreshError) {
              logger.error('Error refreshing session', refreshError)
              // Ne pas déconnecter en cas d'erreur réseau temporaire
            }
          } else if (timeUntilExpiry <= 0) {
            // Session déjà expirée
            logger.info('Session has expired, signing out')
            try {
              await authService.signOut()
            } catch (signOutError) {
              logger.error('Error during sign out', signOutError)
            }
            resetUserState()
          }
        }
      } catch (error) {
        logger.error('Error in session validity check', error)
        // En cas d'erreur réseau, ne pas déconnecter immédiatement (peut être temporaire)
      }
    }

    // Vérifier immédiatement au chargement
    checkSessionValidity()

    // Vérifier périodiquement
    const intervalId = setInterval(checkSessionValidity, SESSION_CHECK_INTERVAL)

    return () => {
      clearInterval(intervalId)
    }
  }, [user])

  const signIn = async (email, password) => {
    const { data, error } = await authService.signIn(email, password)
    
    if (error) throw error
    
    // Mettre à jour l'utilisateur immédiatement
    if (data.user) {
      setUser(data.user)
      
      // Charger le profil de manière asynchrone
      getUserProfileWithRole(data.user.id)
        .then(({ role: userRole, profile: userProfile }) => {
          setRole(userRole)
          setProfile(userProfile)
          
          // Sauvegarder le profil dans les profils récents
          if (userProfile) {
            try {
              addRecentProfile({
                id: data.user.id,
                name: userProfile.nom || email,
                email: email,
                role: userRole || 'educator',
              })
            } catch (err) {
              logger.debug('Error adding to recent profiles', err)
            }
          }
          
          logger.debug('Profile loaded after signIn', { userId: data.user.id, role: userRole })
        })
        .catch((err) => {
          logger.error('Error loading profile after signIn', err)
        })
    }
    
    return { data, error }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      resetUserState()
    } catch (error) {
      logger.error('Error during sign out', error)
      // Même en cas d'erreur, réinitialiser l'état local
      resetUserState()
      throw error
    }
  }

  const value = {
    user,
    role,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: role === ROLES.ADMIN,
    isEducator: role === ROLES.EDUCATOR,
    isController: role === ROLES.CONTROLLER,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

