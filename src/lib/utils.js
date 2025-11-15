import { format, parseISO, isValid, differenceInDays, addDays, isBefore, isAfter } from 'date-fns'
import { fr } from 'date-fns/locale'
import { STATUTS_PAIEMENT, PERIODE_GRACE, PRIX_MENSUEL } from './constants'

/**
 * Formate une date au format français
 * @param {string|Date} date - Date à formater
 * @param {string} formatStr - Format de date (par défaut: 'dd/MM/yyyy')
 * @returns {string} Date formatée
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    return format(dateObj, formatStr, { locale: fr })
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

/**
 * Formate une date avec l'heure
 * @param {string|Date} date - Date à formater
 * @returns {string} Date et heure formatées
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Formate un montant en FCFA
 * @param {number} amount - Montant à formater
 * @returns {string} Montant formaté
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formate un mois au format français (ex: "novembre 2026")
 * @param {string} monthStr - Mois au format "yyyy-MM"
 * @returns {string} Mois formaté en français
 */
export const formatMonthFrench = (monthStr) => {
  if (!monthStr) return ''
  try {
    const date = parseISO(monthStr + '-01')
    return format(date, 'MMMM yyyy', { locale: fr })
  } catch {
    return monthStr
  }
}

/**
 * Formate une liste de mois en français (ex: "novembre 2026, décembre 2026")
 * @param {string[]} months - Liste de mois au format "yyyy-MM"
 * @returns {string} Mois formatés en français séparés par des virgules
 */
export const formatMonthsListFrench = (months) => {
  if (!months || months.length === 0) return 'Aucun'
  try {
    return months.map(m => formatMonthFrench(m)).join(', ')
  } catch {
    return months.join(', ')
  }
}

/**
 * Calcule le statut de paiement d'un étudiant
 * @param {string|Date} dateDernierPaiement - Date du dernier paiement
 * @param {string|Date} dateEcheance - Date d'échéance
 * @returns {string} Statut du paiement
 */
export const calculerStatutPaiement = (dateDernierPaiement, dateEcheance) => {
  if (!dateDernierPaiement || !dateEcheance) {
    return STATUTS_PAIEMENT.HORS_SERVICE
  }

  const aujourdhui = new Date()
  const datePaiement = typeof dateDernierPaiement === 'string' 
    ? parseISO(dateDernierPaiement) 
    : dateDernierPaiement
  const dateEch = typeof dateEcheance === 'string' 
    ? parseISO(dateEcheance) 
    : dateEcheance

  if (!isValid(datePaiement) || !isValid(dateEch)) {
    return STATUTS_PAIEMENT.HORS_SERVICE
  }

  const joursRestants = differenceInDays(dateEch, aujourdhui)
  const dateLimite = addDays(dateEch, PERIODE_GRACE)

  if (isAfter(aujourdhui, dateLimite)) {
    return STATUTS_PAIEMENT.EXPIRE
  }

  if (joursRestants < 0 && isBefore(aujourdhui, dateLimite)) {
    return STATUTS_PAIEMENT.EN_RETARD
  }

  if (joursRestants >= 0) {
    return STATUTS_PAIEMENT.ACTIF
  }

  return STATUTS_PAIEMENT.HORS_SERVICE
}

/**
 * Génère un ID étudiant unique
 * @param {string} prefix - Préfixe (optionnel)
 * @returns {string} ID généré
 */
export const genererIdEtudiant = (prefix = 'EMSP') => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Génère un code QR unique
 * @returns {string} Code QR généré
 */
export const genererCodeQR = () => {
  return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean} True si l'email est valide
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide un numéro de téléphone (format ivoirien)
 * @param {string} phone - Numéro de téléphone à valider
 * @returns {boolean} True si le numéro est valide
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+225|225|0)?[0-9]{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Formate un numéro de téléphone
 * @param {string} phone - Numéro à formater
 * @returns {string} Numéro formaté
 */
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('225')) {
    return `+225 ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`
  }
  if (cleaned.startsWith('0')) {
    return `+225 ${cleaned.substring(1, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`
  }
  return phone
}

/**
 * Débounce une fonction
 * @param {Function} func - Fonction à débouncer
 * @param {number} wait - Temps d'attente en ms
 * @returns {Function} Fonction débouncée
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Classe CSS conditionnelle
 * @param {...any} classes - Classes CSS
 * @returns {string} Classes concaténées
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Calcule le montant total dû
 * @param {number} moisEnRetard - Nombre de mois en retard
 * @returns {number} Montant total dû
 */
export const calculerMontantDu = (moisEnRetard) => {
  return moisEnRetard * PRIX_MENSUEL
}

/**
 * Vérifie si une date est dans la période de grâce
 * @param {string|Date} dateEcheance - Date d'échéance
 * @returns {boolean} True si dans la période de grâce
 */
export const estDansPeriodeGrace = (dateEcheance) => {
  if (!dateEcheance) return false
  
  const aujourdhui = new Date()
  const dateEch = typeof dateEcheance === 'string' 
    ? parseISO(dateEcheance) 
    : dateEcheance
  
  if (!isValid(dateEch)) return false
  
  const dateLimite = addDays(dateEch, PERIODE_GRACE)
  return isAfter(aujourdhui, dateEch) && isBefore(aujourdhui, dateLimite)
}

/**
 * Obtient la couleur selon le statut
 * @param {string} statut - Statut
 * @returns {string} Classe Tailwind
 */
export const getStatusColor = (statut) => {
  const colors = {
    [STATUTS_PAIEMENT.ACTIF]: 'bg-green-100 text-green-800',
    [STATUTS_PAIEMENT.EN_RETARD]: 'bg-yellow-100 text-yellow-800',
    [STATUTS_PAIEMENT.EXPIRE]: 'bg-red-100 text-red-800',
    [STATUTS_PAIEMENT.HORS_SERVICE]: 'bg-gray-100 text-gray-800',
    ACTIF: 'bg-green-100 text-green-800',
    EN_RETARD: 'bg-yellow-100 text-yellow-800',
    EXPIRE: 'bg-red-100 text-red-800',
    HORS_SERVICE: 'bg-gray-100 text-gray-800',
    actif: 'bg-green-100 text-green-800',
    inactif: 'bg-gray-100 text-gray-800',
    suspendu: 'bg-orange-100 text-orange-800',
  }
  return colors[statut] || 'bg-gray-100 text-gray-800'
}

/**
 * Obtient le libellé du statut
 * @param {string} statut - Statut
 * @returns {string} Libellé
 */
export const getStatusLabel = (statut) => {
  const labels = {
    [STATUTS_PAIEMENT.ACTIF]: 'Actif',
    [STATUTS_PAIEMENT.EN_RETARD]: 'En retard',
    [STATUTS_PAIEMENT.EXPIRE]: 'Expiré',
    [STATUTS_PAIEMENT.HORS_SERVICE]: 'Hors service',
    ACTIF: 'Actif',
    EN_RETARD: 'En retard',
    EXPIRE: 'Expiré',
    HORS_SERVICE: 'Hors service',
    actif: 'Actif',
    inactif: 'Inactif',
    suspendu: 'Suspendu',
  }
  return labels[statut] || statut
}

