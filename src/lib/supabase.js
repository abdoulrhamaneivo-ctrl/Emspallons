import { createClient } from '@supabase/supabase-js'
import { env } from './env'
import logger from './logger'

// Créer le client avec les variables validées et optimisations
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'emsp-transport-app',
    },
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

// Cache simple pour éviter les requêtes répétées (survie à la session)
let profileCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper optimisé : récupère le profil ET le rôle en une seule requête avec cache
export const getUserProfileWithRole = async (userId) => {
  if (!userId) return { role: null, profile: null }

  // Vérifier le cache d'abord (évite les requêtes répétées)
  const cached = profileCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.debug('Profile loaded from cache', { userId, role: cached.data.role })
    return cached.data
  }

  try {
    // Sélectionner seulement les champs nécessaires pour optimiser la requête
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nom, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle() // Utiliser maybeSingle pour éviter l'erreur si non trouvé
    
    if (error) {
      logger.error('Error fetching user profile with role', error, { userId })
      return { role: null, profile: null }
    }
    
    if (!data) {
      logger.warn('Profile data is null or not found', null, { userId })
      return { role: null, profile: null }
    }
    
    const role = data?.role || null
    if (!role) {
      logger.warn('User profile exists but has no role', null, { userId, profile: data })
    }
    
    const result = {
      role,
      profile: data || null
    }
    
    // Mettre en cache pour les prochaines requêtes (5 minutes)
    profileCache.set(userId, {
      data: result,
      timestamp: Date.now()
    })
    
    // Nettoyer le cache ancien périodiquement (si > 50 entrées)
    if (profileCache.size > 50) {
      const now = Date.now()
      for (const [key, value] of profileCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          profileCache.delete(key)
        }
      }
    }
    
    return result
  } catch (error) {
    logger.error('Error in getUserProfileWithRole', error, { userId })
    return { role: null, profile: null }
  }
}

// Fonction pour invalider le cache d'un utilisateur (utile après mise à jour)
export const invalidateProfileCache = (userId) => {
  if (userId) {
    profileCache.delete(userId)
    logger.debug('Profile cache invalidated', { userId })
  } else {
    profileCache.clear()
    logger.debug('All profile cache cleared')
  }
}

