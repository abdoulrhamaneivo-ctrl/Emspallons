import { createContext, useContext, useEffect, useState } from 'react'
/* eslint-disable react-refresh/only-export-components */
import { supabase, getUserProfileWithRole } from '../lib/supabase'
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let subscription = null
    let timeoutId = null
    let sessionLoaded = false

    // Timeout de sécurité pour éviter le blocage (réduit à 1 seconde)
    timeoutId = setTimeout(() => {
      if (mounted && !sessionLoaded) {
        logger.warn('Auth loading timeout - forcing loading to false')
        setLoading(false)
      }
    }, 1000) // 1 seconde max pour une réponse plus rapide

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

    // Vérifier la session actuelle
    supabase.auth.getSession()
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
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
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

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    
    // Mettre à jour l'utilisateur immédiatement
    if (data.user) {
      setUser(data.user)
      
      // Charger le profil de manière PRIORITAIRE (sans attendre mais avec priorité)
      // Utiliser getUserProfileWithRole pour une seule requête optimisée
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Invalider le cache du profil lors de la déconnexion
    if (user?.id) {
      const { invalidateProfileCache } = await import('../lib/supabase')
      invalidateProfileCache(user.id)
    }
    
    setUser(null)
    setRole(null)
    setProfile(null)
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

