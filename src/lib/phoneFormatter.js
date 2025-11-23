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
 * Détecte automatiquement selon le code pays ou la longueur du numéro
 */
export const detectCountry = (phone) => {
  const cleaned = cleanPhoneNumber(phone)
  
  if (!cleaned) return 'CI'
  
  // 1. Vérifier si le numéro commence par un code pays
  for (const [country, config] of Object.entries(COUNTRY_CONFIGS)) {
    const countryCode = config.code.replace('+', '')
    if (cleaned.startsWith(countryCode)) {
      return country
    }
  }
  
  // 2. Retirer le préfixe 0 ou code pays pour obtenir la longueur réelle
  let numberWithoutPrefix = cleaned
  if (cleaned.startsWith('0')) {
    numberWithoutPrefix = cleaned.substring(1)
  } else if (cleaned.length >= 10) {
    // Si longue, peut-être qu'un code pays est déjà inclus
    for (const [country, config] of Object.entries(COUNTRY_CONFIGS)) {
      const countryCode = config.code.replace('+', '')
      if (cleaned.startsWith(countryCode)) {
        numberWithoutPrefix = cleaned.substring(countryCode.length)
        break
      }
    }
  }
  
  // 3. Détecter selon la longueur du numéro
  // Côte d'Ivoire : 10 chiffres
  if (numberWithoutPrefix.length === 10) {
    return 'CI'
  }
  // Sénégal : 9 chiffres
  if (numberWithoutPrefix.length === 9) {
    return 'SN'
  }
  // Mali, Burkina Faso, Togo, Bénin, Mauritanie : 8 chiffres
  if (numberWithoutPrefix.length === 8) {
    // Si commence par 0, c'est probablement CI format local (08 XX XXX XXX)
    if (cleaned.startsWith('0')) {
      return 'CI'
    }
    // Par défaut pour 8 chiffres, on peut essayer de détecter selon les préfixes
    // Pour l'instant, on retourne BF (Burkina Faso) comme défaut pour 8 chiffres
    // mais idéalement on devrait avoir plus de contexte
    return 'BF'
  }
  
  // 4. Si commence par 0 et longueur raisonnable, supposer CI
  if (cleaned.startsWith('0') && (numberWithoutPrefix.length >= 8 && numberWithoutPrefix.length <= 10)) {
    return 'CI'
  }
  
  // 5. Par défaut : Côte d'Ivoire
  return 'CI'
}

/**
 * Formate un numéro selon le pays
 */
export const formatPhoneNumber = (phone, country = 'CI') => {
  if (!phone) return ''
  
  const cleaned = cleanPhoneNumber(phone)
  const config = COUNTRY_CONFIGS[country]
  
  if (!config) return phone
  
  // Retirer le code pays ou le préfixe 0 une seule fois
  let number = cleaned
  const countryCode = config.code.replace('+', '')
  
  // 1. Si le numéro commence par le code pays (ex: 225071234567)
  if (cleaned.startsWith(countryCode)) {
    number = cleaned.substring(countryCode.length)
    // Après avoir retiré le code pays, si ça commence par 0, on garde le 0
    // car c'est le format local (ex: 225 devient 071234567)
    // Ne pas retirer le 0 ici, il fait partie du numéro local
  } 
  // 2. Si le numéro commence par 0 (format local, ex: 071234567)
  else if (cleaned.startsWith('0')) {
    number = cleaned.substring(1)
  }
  // 3. Si le numéro commence par + suivi du code pays (ex: +225071234567)
  else if (cleaned.startsWith('+' + countryCode)) {
    number = cleaned.substring(countryCode.length + 1) // +1 pour le signe +
    // Ne pas retirer le 0 après le code pays, il fait partie du format local
  }
  
  // Pour la Côte d'Ivoire : le format attendu est 10 chiffres (07 XX XXX XXX)
  // Le pattern attend un préfixe optionnel (+225, 225, 0) puis les groupes
  // On doit tester avec le numéro complet nettoyé (avec ou sans préfixe)
  
  // Tester le pattern avec le numéro nettoyé original (pour capturer les groupes correctement)
  const match = cleaned.match(config.pattern)
  if (match) {
    return config.format(match)
  }
  
  // Si le pattern ne correspond pas avec le numéro original, essayer avec number (sans préfixe)
  // Mais d'abord, reconstruire le numéro pour le test
  let testNumber = number
  // Si on a retiré le code pays, on doit ajouter 0 au début pour le test du pattern
  if (cleaned.startsWith(countryCode) || cleaned.startsWith('+' + countryCode)) {
    testNumber = '0' + number // Ajouter 0 pour le test du pattern local
  }
  
  const match2 = testNumber.match(config.pattern)
  if (match2) {
    return config.format(match2)
  }
  
  // Format simple si le pattern ne correspond toujours pas
  // Vérifier la longueur attendue
  const expectedLength = config.length
  if (number.length === expectedLength || number.length === expectedLength - 1 || number.length === expectedLength + 1) {
    // Formater avec espaces selon le pays
    if (country === 'CI' && number.length === 10) {
      // Format CI : 07 XX XXX XXX
      return `${config.code} ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`
    } else if (country === 'SN' && number.length === 9) {
      // Format SN : 77 XXX XX XX
      return `${config.code} ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 7)} ${number.substring(7)}`
    } else if ((country === 'ML' || country === 'BF' || country === 'TG' || country === 'BJ' || country === 'MR') && number.length === 8) {
      // Format 8 chiffres : XX XX XX XX
      return `${config.code} ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6)}`
    } else {
    return `${config.code} ${number}`
    }
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

