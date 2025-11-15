/**
 * Formatage téléphone multi-pays pour l'Afrique de l'Ouest
 */

const COUNTRY_CONFIGS = {
  CI: { // Côte d'Ivoire
    code: '+225',
    pattern: /^(\+225|225|0)?([0-9]{2})\s?([0-9]{3})\s?([0-9]{4})$/,
    format: (match) => `+225 ${match[2]} ${match[3]} ${match[4]}`,
    length: 10,
  },
  ML: { // Mali
    code: '+223',
    pattern: /^(\+223|223|0)?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})$/,
    format: (match) => `+223 ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]}`,
    length: 8,
  },
  NE: { // Niger
    code: '+227',
    pattern: /^(\+227|227|0)?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})$/,
    format: (match) => `+227 ${match[2]} ${match[3]} ${match[4]} ${match[5]}`,
    length: 8,
  },
  BF: { // Burkina Faso
    code: '+226',
    pattern: /^(\+226|226|0)?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})$/,
    format: (match) => `+226 ${match[2]} ${match[3]} ${match[4]} ${match[5]}`,
    length: 8,
  },
  TG: { // Togo
    code: '+228',
    pattern: /^(\+228|228|0)?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})$/,
    format: (match) => `+228 ${match[2]} ${match[3]} ${match[4]} ${match[5]}`,
    length: 8,
  },
  MR: { // Mauritanie
    code: '+222',
    pattern: /^(\+222|222|0)?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})$/,
    format: (match) => `+222 ${match[2]} ${match[3]} ${match[4]} ${match[5]}`,
    length: 8,
  },
  SN: { // Sénégal
    code: '+221',
    pattern: /^(\+221|221|0)?([0-9]{2})\s?([0-9]{3})\s?([0-9]{2})\s?([0-9]{2})$/,
    format: (match) => `+221 ${match[2]} ${match[3]} ${match[4]} ${match[5]}`,
    length: 9,
  },
  BJ: { // Bénin
    code: '+229',
    pattern: /^(\+229|229|0)?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})\s?([0-9]{2})$/,
    format: (match) => `+229 ${match[2]} ${match[3]} ${match[4]} ${match[5]}`,
    length: 8,
  },
}

/**
 * Nettoie un numéro de téléphone
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/**
 * Détecte le pays depuis un numéro
 */
export const detectCountry = (phone) => {
  const cleaned = cleanPhoneNumber(phone)
  
  for (const [country, config] of Object.entries(COUNTRY_CONFIGS)) {
    if (cleaned.startsWith(config.code.replace('+', ''))) {
      return country
    }
    if (cleaned.startsWith('0') && country === 'CI') {
      return 'CI' // Par défaut Côte d'Ivoire si commence par 0
    }
  }
  
  return 'CI' // Par défaut
}

/**
 * Formate un numéro selon le pays
 */
export const formatPhoneNumber = (phone, country = 'CI') => {
  if (!phone) return ''
  
  const cleaned = cleanPhoneNumber(phone)
  const config = COUNTRY_CONFIGS[country]
  
  if (!config) return phone
  
  // Retirer le code pays si présent
  let number = cleaned
  if (cleaned.startsWith(config.code.replace('+', ''))) {
    number = cleaned.substring(config.code.length - 1)
  } else if (cleaned.startsWith('0')) {
    number = cleaned.substring(1)
  }
  
  // Appliquer le pattern
  const match = number.match(config.pattern)
  if (match) {
    return config.format(match)
  }
  
  // Format simple si le pattern ne correspond pas
  if (number.length >= config.length - 2) {
    return `${config.code} ${number}`
  }
  
  return phone
}

/**
 * Valide un numéro selon le pays
 */
export const validatePhoneNumber = (phone, country = 'CI') => {
  if (!phone) return false
  
  const cleaned = cleanPhoneNumber(phone)
  const config = COUNTRY_CONFIGS[country]
  
  if (!config) return false
  
  // Retirer le code pays si présent
  let number = cleaned
  if (cleaned.startsWith(config.code.replace('+', ''))) {
    number = cleaned.substring(config.code.length - 1)
  } else if (cleaned.startsWith('0')) {
    number = cleaned.substring(1)
  }
  
  return config.pattern.test(number) && number.length >= config.length - 2
}

/**
 * Liste des pays disponibles
 */
export const getAvailableCountries = () => {
  return [
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱' },
    { code: 'NE', name: 'Niger', flag: '🇳🇪' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬' },
    { code: 'MR', name: 'Mauritanie', flag: '🇲🇷' },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  ]
}

