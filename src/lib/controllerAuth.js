import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Hash un mot de passe via Edge Function
 */
export const hashPassword = async (password) => {
  try {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL n\'est pas défini')
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/hash-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors du hash du mot de passe')
    }

    const data = await response.json()
    return data.hash
  } catch (error) {
    console.error('Error hashing password:', error)
    throw error
  }
}

/**
 * Vérifie un mot de passe via Edge Function
 */
export const verifyPassword = async (password, hash) => {
  try {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL n\'est pas défini')
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ password, hash }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la vérification')
    }

    const data = await response.json()
    return data.valid
  } catch (error) {
    console.error('Error verifying password:', error)
    throw error
  }
}

// Cache pour les contrôleurs (évite les requêtes répétées pour le même code)
let controllerCache = new Map()
const CONTROLLER_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Authentifie un contrôleur (optimisé avec cache)
 */
export const loginController = async (code, password) => {
  try {
    // Vérifier le cache d'abord (si la session est récente)
    const cacheKey = `${code}_${password.substring(0, 4)}` // Cache partiel du mot de passe
    const cached = controllerCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CONTROLLER_CACHE_DURATION) {
      // Vérifier quand même le mot de passe complet
      const isValid = await verifyPassword(password, cached.password_hash)
      if (isValid) {
        return cached.controllerData
      }
    }

    // 1. Récupérer le contrôleur par code (optimisé : seulement les champs nécessaires)
    const { data: controller, error: controllerError } = await supabase
      .from('controllers')
      .select(`
        id,
        nom,
        code,
        ligne_id,
        password_hash,
        active,
        lines:ligne_id (
          id,
          nom,
          couleur
        )
      `)
      .eq('code', code)
      .eq('active', true)
      .maybeSingle() // Utiliser maybeSingle pour éviter erreur si non trouvé

    if (controllerError) {
      throw new Error('Erreur lors de la vérification du contrôleur')
    }

    if (!controller) {
      throw new Error('Code contrôleur invalide ou contrôleur inactif')
    }

    // 2. Vérifier qu'il a une ligne assignée
    if (!controller.ligne_id) {
      throw new Error('Aucune ligne assignée à ce contrôleur')
    }

    // 3. Vérifier le mot de passe
    if (!controller.password_hash) {
      throw new Error('Mot de passe non configuré pour ce contrôleur')
    }

    const isValid = await verifyPassword(password, controller.password_hash)
    if (!isValid) {
      throw new Error('Mot de passe incorrect')
    }

    // 4. Préparer les données de session
    const controllerData = {
      id: controller.id,
      name: controller.nom,
      code: controller.code,
      line_id: controller.ligne_id,
      line_name: controller.lines?.nom || '',
      line_color: controller.lines?.couleur || '#7CB342',
    }

    // Mettre en cache (avec hash du mot de passe pour vérification ultérieure)
    controllerCache.set(cacheKey, {
      controllerData,
      password_hash: controller.password_hash,
      timestamp: Date.now()
    })

    // Nettoyer le cache ancien si trop d'entrées
    if (controllerCache.size > 20) {
      const now = Date.now()
      for (const [key, value] of controllerCache.entries()) {
        if (now - value.timestamp > CONTROLLER_CACHE_DURATION) {
          controllerCache.delete(key)
        }
      }
    }

    return controllerData
  } catch (error) {
    console.error('Error logging in controller:', error)
    throw error
  }
}

/**
 * Génère un code contrôleur aléatoire (format XXXX-XXXX)
 */
export const generateControllerCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const part1 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  const part2 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  return `${part1}-${part2}`
}

/**
 * Génère un mot de passe sécurisé aléatoire
 */
export const generateSecurePassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
}

