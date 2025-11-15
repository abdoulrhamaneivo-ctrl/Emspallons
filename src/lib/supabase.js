import { createClient } from '@supabase/supabase-js'
import { env } from './env'
import logger from './logger'

// Créer le client avec les variables validées
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

logger.info('Supabase client initialisé', {
  url: env.SUPABASE_URL.substring(0, 30) + '...'
})

// Helper pour vérifier le rôle de l'utilisateur
export const getUserRole = async (userId) => {
  if (!userId) {
    logger.warn('getUserRole: userId is null or undefined')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      logger.error('Error fetching user role', error, { userId })
      // Si le profil n'existe pas, c'est un problème grave
      if (error.code === 'PGRST116') {
        logger.error('Profile not found for user', null, { userId })
      }
      return null
    }
    
    logger.debug('getUserRole result:', { userId, role: data?.role })
    return data?.role || null
  } catch (error) {
    logger.error('Error in getUserRole', error, { userId })
    return null
  }
}

// Helper pour obtenir le profil utilisateur complet
export const getUserProfile = async (userId) => {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      logger.error('Error fetching user profile', error, { userId })
      return null
    }
    
    return data
  } catch (error) {
    logger.error('Error in getUserProfile', error, { userId })
    return null
  }
}

