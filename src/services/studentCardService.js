import QRCode from 'qrcode'
import CryptoJS from 'crypto-js'

/**
 * Génère les données JSON pour le QR code
 * IMPORTANT : Utilise le qr_code_token brut pour être compatible avec le scanner
 * Le scanner cherche directement avec .eq('qr_code_token', qrToken)
 */
export const generateQRCodeData = (student) => {
  if (!student.qr_code_token) {
    throw new Error('QR code token manquant pour cet étudiant')
  }

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + 6) // Valide 6 mois

  // Utiliser le qr_code_token brut (même format que QRCodeDisplay)
  // Le scanner attend ce token directement dans la base de données
  return {
    studentId: student.id,
    token: student.qr_code_token, // Token brut (compatible avec le scanner)
    generatedAt: student.created_at || now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    version: '1.0'
  }
}

/**
 * Génère un QR code PNG haute qualité
 * @param {Object} student - Données de l'étudiant
 * @returns {Promise<string>} - Data URL du QR code
 */
export const generateHighQualityQRCode = async (student) => {
  try {
    const qrData = generateQRCodeData(student)
    const jsonString = JSON.stringify(qrData)

    const qrDataUrl = await QRCode.toDataURL(jsonString, {
      width: 512,
      margin: 4, // 20px de marge (4 * 5px)
      errorCorrectionLevel: 'H', // High error correction
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return qrDataUrl
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error)
    throw error
  }
}

/**
 * Génère les initiales d'un étudiant
 */
export const getInitials = (nom, prenom) => {
  const first = nom ? nom[0].toUpperCase() : ''
  const second = prenom ? prenom[0].toUpperCase() : nom && nom.length > 1 ? nom[1].toUpperCase() : ''
  return `${first}${second}` || '??'
}

/**
 * Génère une couleur basée sur le nom (pour l'avatar)
 */
export const getAvatarColor = (nom) => {
  const colors = [
    '#2D5016', // Vert EMSP
    '#7CB342', // Vert clair
    '#FDB913', // Jaune EMSP
    '#1976D2', // Bleu
    '#7B1FA2', // Violet
    '#C2185B', // Rose
    '#E64A19', // Orange
    '#00796B', // Vert foncé
  ]
  
  let hash = 0
  for (let i = 0; i < nom.length; i++) {
    hash = nom.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

