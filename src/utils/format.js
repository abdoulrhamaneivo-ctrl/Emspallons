/**
 * Utilitaires de formatage réutilisables
 */

/**
 * Formate une date en français
 */
export function formatDate(date, format = 'full') {
  if (!date) return '-'
  
  const d = date instanceof Date ? date : new Date(date)
  
  if (isNaN(d.getTime())) return '-'
  
  const formats = {
    full: { dateStyle: 'long', timeStyle: 'short' },
    date: { dateStyle: 'long' },
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    time: { timeStyle: 'short' }
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', formats[format] || formats.full).format(d)
  } catch (error) {
    return '-'
  }
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhone(phone) {
  if (!phone) return ''
  
  // Retire tous les caractères non-numériques sauf le +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Format : +225 XX XX XX XX XX
  if (cleaned.startsWith('+225')) {
    const numbers = cleaned.substring(4)
    return `+225 ${numbers.match(/.{1,2}/g)?.join(' ') || numbers}`
  }
  
  return cleaned
}

/**
 * Formate un montant en FCFA
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '0 FCFA'
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(amount) + ' FCFA'
}

/**
 * Formate un code contrôleur (XXXX-XXXX)
 */
export function formatControllerCode(code) {
  if (!code) return ''
  
  const cleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  
  if (cleaned.length <= 4) return cleaned
  
  return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 8)}`
}

/**
 * Valide un code contrôleur
 */
export function validateControllerCode(code) {
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return regex.test(code)
}

