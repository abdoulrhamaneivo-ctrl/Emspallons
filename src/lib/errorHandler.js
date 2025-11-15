import logger from './logger'
import toast from 'react-hot-toast'

/**
 * Gestion centralisée des erreurs
 */

// Types d'erreurs
export const ErrorType = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
}

// Messages d'erreur user-friendly
const errorMessages = {
  [ErrorType.NETWORK]: 'Problème de connexion. Vérifiez votre internet.',
  [ErrorType.AUTH]: 'Session expirée. Veuillez vous reconnecter.',
  [ErrorType.VALIDATION]: 'Données invalides. Vérifiez les champs.',
  [ErrorType.NOT_FOUND]: 'Ressource introuvable.',
  [ErrorType.PERMISSION]: 'Vous n\'avez pas les permissions nécessaires.',
  [ErrorType.UNKNOWN]: 'Une erreur est survenue. Réessayez.'
}

/**
 * Détecte le type d'erreur
 */
function detectErrorType(error) {
  if (!navigator.onLine) return ErrorType.NETWORK
  
  const errorMessage = error?.message?.toLowerCase() || ''
  const errorCode = error?.code?.toLowerCase() || ''
  
  if (errorMessage.includes('auth') || errorCode.includes('auth')) {
    return ErrorType.AUTH
  }
  if (errorMessage.includes('not found') || errorCode === 'pgrst116') {
    return ErrorType.NOT_FOUND
  }
  if (errorMessage.includes('permission') || errorMessage.includes('row-level security')) {
    return ErrorType.PERMISSION
  }
  if (errorMessage.includes('invalid') || errorMessage.includes('required') || errorMessage.includes('validation')) {
    return ErrorType.VALIDATION
  }
  
  return ErrorType.UNKNOWN
}

/**
 * Gère une erreur et affiche un message utilisateur
 */
export function handleError(error, context = '') {
  const errorType = detectErrorType(error)
  const userMessage = errorMessages[errorType]

  // Logger l'erreur
  logger.error(`Error in ${context}`, error, {
    type: errorType,
    message: error?.message,
    stack: error?.stack
  })

  // Afficher un toast à l'utilisateur
  toast.error(userMessage, {
    duration: 4000,
    icon: '❌'
  })

  // Retourner l'erreur pour traitement additionnel si nécessaire
  return {
    type: errorType,
    message: userMessage,
    originalError: error
  }
}

/**
 * Wrapper pour les fonctions async avec gestion d'erreur automatique
 */
export function withErrorHandling(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context)
      throw error // Re-throw pour que l'appelant puisse aussi gérer
    }
  }
}

/**
 * Système de retry pour les requêtes échouées
 */
export async function withRetry(fn, options = {}) {
  const { maxRetries = 3, delay = 1000, context = '' } = options

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1
      
      if (isLastAttempt) {
        handleError(error, context)
        throw error
      }

      logger.warn(`Retry ${i + 1}/${maxRetries} for ${context}`, {
        error: error?.message
      })

      // Attendre avant de réessayer (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

