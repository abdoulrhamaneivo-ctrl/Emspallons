/**
 * Service d'authentification - Abstraction du backend
 */

import { apiClient } from '../apiClient'
import { getUserProfileWithRole, invalidateProfileCache } from '../../supabase'
import logger from '../../logger'

class AuthService {
  constructor() {
    this.supabase = apiClient.getSupabaseClient()
  }

  /**
   * Obtenir la session actuelle
   */
  async getSession() {
    try {
      return await apiClient.execute(() => this.supabase.auth.getSession())
    } catch (error) {
      logger.error('Error getting session', error)
      throw error
    }
  }

  /**
   * Se connecter
   */
  async signIn(email, password) {
    try {
      return await apiClient.execute(() => 
        this.supabase.auth.signInWithPassword({ email, password })
      )
    } catch (error) {
      logger.error('Error signing in', error)
      throw error
    }
  }

  /**
   * Se déconnecter
   */
  async signOut() {
    try {
      const result = await apiClient.execute(() => this.supabase.auth.signOut())
      
      // Invalider le cache
      const { data: { session } } = await this.getSession()
      if (session?.user?.id) {
        invalidateProfileCache(session.user.id)
      }
      
      return result
    } catch (error) {
      logger.error('Error signing out', error)
      throw error
    }
  }

  /**
   * Rafraîchir la session
   */
  async refreshSession() {
    try {
      return await apiClient.execute(() => this.supabase.auth.refreshSession())
    } catch (error) {
      logger.error('Error refreshing session', error)
      throw error
    }
  }

  /**
   * Obtenir le profil utilisateur avec rôle
   */
  async getUserProfileWithRole(userId) {
    try {
      return await getUserProfileWithRole(userId)
    } catch (error) {
      logger.error('Error getting user profile', error)
      throw error
    }
  }

  /**
   * Écouter les changements d'authentification
   */
  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
export default authService

