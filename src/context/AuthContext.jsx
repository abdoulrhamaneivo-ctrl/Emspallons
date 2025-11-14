import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserRole, getUserProfile } from '../lib/supabase'
import { ROLES } from '../lib/constants'

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
    // Vérifier la session actuelle
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const userRole = await getUserRole(session.user.id)
        const userProfile = await getUserProfile(session.user.id)
        setRole(userRole)
        setProfile(userProfile)
      }
      setLoading(false)
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const userRole = await getUserRole(session.user.id)
        const userProfile = await getUserProfile(session.user.id)
        setRole(userRole)
        setProfile(userProfile)
      } else {
        setRole(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
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

