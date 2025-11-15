/**
 * Utilitaires de validation réutilisables
 */

/**
 * Valide un email
 */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Valide un numéro de téléphone ivoirien
 */
export function validatePhone(phone) {
  if (!phone) return false
  
  // +225 suivi de 10 chiffres
  const cleaned = phone.replace(/\s/g, '')
  const regex = /^\+?225\d{10}$/
  return regex.test(cleaned)
}

/**
 * Valide un mot de passe
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 6,
    requireUppercase = false,
    requireNumber = false,
    requireSpecial = false
  } = options

  const errors = []

  if (password.length < minLength) {
    errors.push(`Minimum ${minLength} caractères requis`)
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Une majuscule requise')
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push('Un chiffre requis')
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Un caractère spécial requis')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valide un nom (lettres, espaces, tirets, apostrophes)
 */
export function validateName(name) {
  if (!name || name.trim().length === 0) return false
  const regex = /^[a-zA-ZÀ-ÿ\s'-]+$/
  return regex.test(name.trim())
}

/**
 * Valide une URL
 */
export function validateURL(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

