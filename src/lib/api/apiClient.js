/**
 * Client API centralisé pour abstraire le backend
 * Permet de changer facilement de backend sans impacter le reste de l'application
 */

import { supabase } from '../supabase'
import logger from '../logger'

// Configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 seconde
const REQUEST_TIMEOUT = 30000 // 30 secondes

/**
 * Délai avant retry (exponential backoff)
 */
const getRetryDelay = (attempt) => {
  return RETRY_DELAY * Math.pow(2, attempt)
}

/**
 * Vérifier si une erreur est récupérable (peut être retentée)
 */
const isRetryableError = (error) => {
  if (!error) return false
  
  // Erreurs réseau
  if (error.message?.includes('network') || 
      error.message?.includes('fetch') ||
      error.message?.includes('timeout')) {
    return true
  }
  
  // Erreurs Supabase spécifiques
  if (error.code === 'PGRST301' || // Timeout
      error.code === 'PGRST302' || // Connection error
      error.status === 408 || // Request timeout
      error.status === 429 || // Too many requests
      error.status === 500 || // Internal server error
      error.status === 502 || // Bad gateway
      error.status === 503 || // Service unavailable
      error.status === 504) { // Gateway timeout
    return true
  }
  
  return false
}

/**
 * Retry avec exponential backoff
 */
const retryRequest = async (fn, attempt = 0) => {
  try {
    return await fn()
  } catch (error) {
    if (attempt >= MAX_RETRIES || !isRetryableError(error)) {
      throw error
    }
    
    const delay = getRetryDelay(attempt)
    logger.warn(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`, { error })
    
    await new Promise(resolve => setTimeout(resolve, delay))
    return retryRequest(fn, attempt + 1)
  }
}

/**
 * Timeout wrapper pour les requêtes
 */
const withTimeout = (promise, timeout = REQUEST_TIMEOUT) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ])
}

/**
 * Client API principal
 */
class ApiClient {
  constructor() {
    this.supabase = supabase
  }

  /**
   * Exécuter une requête avec retry et timeout
   */
  async execute(requestFn, options = {}) {
    const { timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES } = options
    
    try {
      const request = () => withTimeout(requestFn(), timeout)
      return await retryRequest(request, 0)
    } catch (error) {
      logger.error('API request failed', error)
      throw this.normalizeError(error)
    }
  }

  /**
   * Normaliser les erreurs pour une gestion uniforme
   */
  normalizeError(error) {
    if (!error) {
      return new Error('Unknown error')
    }

    // Erreur déjà normalisée
    if (error instanceof Error) {
      return error
    }

    // Erreur Supabase
    if (error.message) {
      return new Error(error.message)
    }

    // Erreur réseau
    if (error.code === 'PGRST301' || error.code === 'PGRST302') {
      return new Error('Erreur de connexion. Vérifiez votre connexion internet.')
    }

    return new Error(error.toString() || 'Une erreur est survenue')
  }

  /**
   * Vérifier la connexion
   */
  async checkConnection() {
    try {
      const result = await this.execute(() => 
        this.supabase.from('profiles').select('id').limit(1)
      )
      return !result.error
    } catch {
      return false
    }
  }

  /**
   * Obtenir le client Supabase (pour compatibilité)
   */
  getSupabaseClient() {
    return this.supabase
  }
}

// Instance singleton
export const apiClient = new ApiClient()

// Export par défaut
export default apiClient

