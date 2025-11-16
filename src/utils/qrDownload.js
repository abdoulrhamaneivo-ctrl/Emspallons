/**
 * Utilitaire pour télécharger un QR code depuis un token
 */
import QRCode from 'qrcode'

/**
 * Télécharge un QR code depuis un token étudiant
 * @param {Object} student - Objet étudiant avec qr_code_token
 * @param {string} student.qr_code_token - Token du QR code
 * @param {string} student.nom - Nom de l'étudiant
 * @param {string} student.prenom - Prénom de l'étudiant (optionnel)
 * @param {string} student.id - ID de l'étudiant
 * @returns {Promise<void>}
 */
export async function downloadQRCodeFromToken(student) {
  try {
    if (!student?.qr_code_token) {
      throw new Error('Token QR code manquant')
    }

    // Générer le token JSON sécurisé
    const qrData = {
      studentId: student.id,
      token: student.qr_code_token,
      generatedAt: student.created_at || new Date().toISOString(),
    }

    const qrDataString = JSON.stringify(qrData)

    // Générer le QR code en image PNG
    const qrDataUrl = await QRCode.toDataURL(qrDataString, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })

    // Créer un lien de téléchargement
    const downloadLink = document.createElement('a')
    const fileName = `QR-${student.nom}-${student.prenom || 'student'}-${student.id.substring(0, 8)}.png`
    
    downloadLink.download = fileName
    downloadLink.href = qrDataUrl
    downloadLink.click()

    return true
  } catch (error) {
    console.error('Erreur lors du téléchargement du QR code:', error)
    throw error
  }
}

