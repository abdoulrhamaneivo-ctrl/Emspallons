import { createClient } from '@supabase/supabase-js'

// Variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variables d\'environnement Supabase manquantes.\n' +
    'Créez un fichier .env.local avec:\n' +
    'VITE_SUPABASE_URL=votre_url\n' +
    'VITE_SUPABASE_ANON_KEY=votre_cle'
  )
}

// Client Supabase initialisé
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Helper pour vérifier le rôle de l'utilisateur
export const getUserRole = async (userId) => {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }
    
    return data?.role
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return null
  }
}

// Helper pour obtenir le profil utilisateur complet
export const getUserProfile = async (userId) => {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

