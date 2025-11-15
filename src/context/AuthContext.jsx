import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserRole, getUserProfile } from '../lib/supabase'
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

    // Timeout de sécurité pour éviter le blocage
    timeoutId = setTimeout(() => {
      if (mounted && !sessionLoaded) {
        logger.warn('Auth loading timeout - forcing loading to false')
        setLoading(false)
      }
    }, 3000) // 3 secondes max

    // Fonction pour charger le profil utilisateur
    const loadUserProfile = async (userId) => {
      if (!userId) return { role: null, profile: null }
      
      try {
        const [userRole, userProfile] = await Promise.all([
          getUserRole(userId),
          getUserProfile(userId),
        ])
        return { role: userRole, profile: userProfile }
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
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return
        
        // Ignorer le premier événement (déjà géré par getSession)
        if (!sessionLoaded) return
        
        try {
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
          logger.error('Error in onAuthStateChange', error)
          if (mounted) {
            setUser(null)
            setRole(null)
            setProfile(null)
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
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      const userRole = await getUserRole(data.user.id)
      const userProfile = await getUserProfile(data.user.id)
      setRole(userRole)
      setProfile(userProfile)
      
      // Sauvegarder le profil dans les profils récents
      if (userProfile) {
        addRecentProfile({
          id: data.user.id,
          name: userProfile.nom || email,
          email: email,
          role: userRole || 'educator',
        })
      }
    }
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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

