/**
 * Gestion des profils récents dans localStorage
 */

const STORAGE_KEY = 'recent_profiles'
const MAX_PROFILES = 5

/**
 * Récupère les profils récents depuis localStorage
 */
export const getRecentProfiles = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const profiles = JSON.parse(stored)
    // Trier par date de connexion (plus récent en premier)
    return profiles.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
  } catch (error) {
    console.error('Error reading recent profiles:', error)
    return []
  }
}

/**
 * Ajoute ou met à jour un profil dans les profils récents
 */
export const addRecentProfile = (profile) => {
  try {
    const profiles = getRecentProfiles()
    
    // Vérifier si le profil existe déjà
    const existingIndex = profiles.findIndex(p => p.id === profile.id)
    
    if (existingIndex >= 0) {
      // Mettre à jour le profil existant
      profiles[existingIndex] = {
        ...profile,
        lastLogin: new Date().toISOString(),
      }
    } else {
      // Ajouter le nouveau profil
      profiles.unshift({
        ...profile,
        lastLogin: new Date().toISOString(),
      })
    }
    
    // Limiter à MAX_PROFILES et sauvegarder
    const limited = profiles.slice(0, MAX_PROFILES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
    
    return limited
  } catch (error) {
    console.error('Error saving recent profile:', error)
    return []
  }
}

/**
 * Supprime un profil des profils récents
 */
export const removeRecentProfile = (profileId) => {
  try {
    const profiles = getRecentProfiles()
    const filtered = profiles.filter(p => p.id !== profileId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Error removing recent profile:', error)
    return []
  }
}

/**
 * Vide tous les profils récents
 */
export const clearRecentProfiles = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing recent profiles:', error)
  }
}

