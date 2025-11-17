import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import { format } from 'date-fns'
import { formatCurrency } from '../lib/utils'

/**
 * Génère un numéro de reçu unique
 * Format: RCP-YYYY-MM-XXXX
 */
const generateReceiptNumber = (paymentId) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const shortId = paymentId.substring(0, 8).toUpperCase().replace(/-/g, '')
  return `RCP-${year}-${month}-${shortId}`
}

/**
 * Formate une date en français
 */
const formatDateFrench = (dateString) => {
  try {
    const date = new Date(dateString)
    const monthNames = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ]
    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  } catch (error) {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }
}

/**
 * Charge une image depuis une URL et retourne une promesse
 */
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Génère un QR code pour le reçu
 */
const generateQRCode = async (receiptNumber, paymentId) => {
  try {
    const verificationData = JSON.stringify({
      receipt: receiptNumber,
      paymentId: paymentId,
      timestamp: new Date().toISOString()
    })
    
    const qrDataUrl = await QRCode.toDataURL(verificationData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#2D5016',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
    
    return qrDataUrl
  } catch (error) {
    console.error('Erreur génération QR code:', error)
    return null
  }
}

/**
 * Convertit une couleur hex en RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Helper pour dessiner une ligne horizontale (hr) dans le PDF
 * Cette fonction est utilisée par le bundler et doit être sécurisée
 * @param {jsPDF} doc - Document jsPDF
 * @param {number} y - Position Y de la ligne
 * @param {Array|Object|string} color - Couleur (RGB array, RGB object, ou hex string)
 * @param {number} lineWidth - Épaisseur de la ligne (défaut: 1)
 * @param {number} xStart - Position X de début (défaut: margin)
 * @param {number} xEnd - Position X de fin (défaut: pageWidth - margin)
 */
export const hr = (doc, y, color = [0, 0, 0], lineWidth = 1, xStart = null, xEnd = null) => {
  try {
    // Normaliser la couleur en tableau RGB [r, g, b]
    let rgbColor = [0, 0, 0] // Par défaut : noir
    
    if (Array.isArray(color)) {
      // Déjà un tableau [r, g, b]
      rgbColor = color.map(c => Math.max(0, Math.min(255, Math.round(c || 0))))
    } else if (color && typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
      // Objet {r, g, b}
      rgbColor = [
        Math.max(0, Math.min(255, Math.round(color.r || 0))),
        Math.max(0, Math.min(255, Math.round(color.g || 0))),
        Math.max(0, Math.min(255, Math.round(color.b || 0)))
      ]
    } else if (typeof color === 'string' && color.startsWith('#')) {
      // Chaîne hex
      const rgb = hexToRgb(color)
      if (rgb) {
        rgbColor = [rgb.r, rgb.g, rgb.b]
      }
    }
    
    // S'assurer que toutes les valeurs sont valides
    rgbColor = rgbColor.map(c => Math.max(0, Math.min(255, Math.round(c || 0))))
    
    // Obtenir les dimensions de la page si non fournies
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    const startX = xStart !== null ? xStart : margin
    const endX = xEnd !== null ? xEnd : (pageWidth - margin)
    
    // Dessiner la ligne
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2])
    doc.setLineWidth(lineWidth)
    doc.line(startX, y, endX, y)
  } catch (error) {
    // En cas d'erreur, dessiner une ligne noire par défaut
    console.error('Erreur dans hr():', error)
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.line(margin, y, pageWidth - margin, y)
  }
}

/**
 * Génère un reçu PDF moderne et professionnel avec design amélioré
 * @param {Object} payment - Données du paiement
 * @param {Object} student - Données de l'étudiant
 * @returns {Promise<jsPDF>} - Document PDF généré
 */
export const generateReceiptPDF = async (payment, student) => {
  try {
    // Validation des données d'entrée
    if (!payment || !student) {
      throw new Error('Données de paiement ou d\'étudiant manquantes')
    }
    if (!payment.id || !payment.montant_total || !payment.nombre_mois) {
      throw new Error('Données de paiement incomplètes')
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)
  
    // Couleurs EMSP
    const emspGreen = '#2D5016'
    const emspYellow = '#FDB913'
    const emspLightGreen = '#7CB342'
    const grayLight = '#F5F5F5'
    const grayMedium = '#999999'
    const grayDark = '#333333'
  
    // Convertir les couleurs hex en RGB (avec valeurs par défaut si conversion échoue)
    // S'assurer que toutes les valeurs sont valides (entre 0 et 255)
    const greenRgb = hexToRgb(emspGreen) || { r: 45, g: 80, b: 22 }
    const yellowRgb = hexToRgb(emspYellow) || { r: 253, g: 185, b: 19 }
    const lightGreenRgb = hexToRgb(emspLightGreen) || { r: 124, g: 179, b: 66 }
    const grayLightRgb = hexToRgb(grayLight) || { r: 245, g: 245, b: 245 }
    const grayMediumRgb = hexToRgb(grayMedium) || { r: 153, g: 153, b: 153 }
    const grayDarkRgb = hexToRgb(grayDark) || { r: 51, g: 51, b: 51 }
  
    // Fonction helper pour s'assurer que les valeurs RGB sont valides
    const ensureValidRgb = (rgb) => {
      if (!rgb || typeof rgb.r !== 'number' || typeof rgb.g !== 'number' || typeof rgb.b !== 'number') {
        return { r: 0, g: 0, b: 0 }
      }
      return {
        r: Math.max(0, Math.min(255, Math.round(rgb.r))),
        g: Math.max(0, Math.min(255, Math.round(rgb.g))),
        b: Math.max(0, Math.min(255, Math.round(rgb.b)))
      }
    }
  
    // Valider toutes les couleurs RGB
    const validGreenRgb = ensureValidRgb(greenRgb)
    const validYellowRgb = ensureValidRgb(yellowRgb)
    const validLightGreenRgb = ensureValidRgb(lightGreenRgb)
    const validGrayLightRgb = ensureValidRgb(grayLightRgb)
    const validGrayMediumRgb = ensureValidRgb(grayMediumRgb)
    const validGrayDarkRgb = ensureValidRgb(grayDarkRgb)
  
    // Utiliser les couleurs validées partout
    const gRgb = validGreenRgb
    const yRgb = validYellowRgb
    const lgRgb = validLightGreenRgb
    const glRgb = validGrayLightRgb
    const gmRgb = validGrayMediumRgb
    const gdRgb = validGrayDarkRgb
  
    let yPosition = margin
  
    // ============================================
    // HEADER SIMPLE
    // ============================================
    
    // Titre simple
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('REÇU DE PAIEMENT', pageWidth / 2, yPosition, { align: 'center' })
    
    yPosition += 10
  
    // Numéro de reçu simple
    const receiptNumber = generateReceiptNumber(payment.id)
    const emissionDate = formatDateFrench(new Date().toISOString())
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text(`N° ${receiptNumber}`, margin, yPosition)
    doc.text(`Émis le ${emissionDate}`, pageWidth - margin, yPosition, { align: 'right' })
  
    yPosition += 12
  
    // ============================================
    // INFORMATIONS ÉTUDIANT - SIMPLE
    // ============================================
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('Étudiant :', margin, yPosition)
    
    yPosition += 7
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text(`${student.nom} ${student.prenom || ''}`.trim(), margin, yPosition)
    yPosition += 6
    doc.text(`Classe : ${student.classe || 'N/A'}`, margin, yPosition)
    yPosition += 6
    doc.text(`Ligne : ${student.lines?.nom || 'N/A'}`, margin, yPosition)
    
    yPosition += 12
  
    // ============================================
    // DÉTAILS PAIEMENT - SIMPLE
    // ============================================
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text(`Abonnement transport scolaire - ${payment.nombre_mois} mois`, margin, yPosition)
    
    yPosition += 10
    
    // Total
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    const totalAmount = formatCurrency(payment.montant_total).replace(' FCFA', ' F')
    doc.text(`TOTAL : ${totalAmount}`, margin, yPosition)
  
    yPosition += 15
  
    // ============================================
    // PÉRIODE COUVERTE - SIMPLE
    // ============================================
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    
    const startDate = formatDateFrench(payment.date_debut)
    const endDate = formatDateFrench(payment.date_fin)
    
    doc.text(`Période : Du ${startDate} au ${endDate}`, margin, yPosition)
  
    yPosition += 15
  
    // ============================================
    // FOOTER - SIMPLE
    // ============================================
    
    // Ligne de séparation
    hr(doc, yPosition, { r: gRgb.r, g: gRgb.g, b: gRgb.b }, 1, margin, pageWidth - margin)
    
    yPosition += 10
  
    // Signature
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text('L\'Administration EMSP', pageWidth - margin, yPosition, { align: 'right' })
    
    yPosition += 5
    hr(doc, yPosition, { r: gRgb.r, g: gRgb.g, b: gRgb.b }, 0.5, pageWidth - margin - 50, pageWidth - margin)

    return doc
  } catch (error) {
    console.error('Erreur détaillée lors de la génération du PDF:', error)
    throw new Error(`Erreur lors de la génération du PDF: ${error.message || 'Erreur inconnue'}`)
  }
}

/**
 * Télécharge le reçu PDF
 * @param {jsPDF} doc - Document PDF
 * @param {string} studentName - Nom de l'étudiant pour le nom de fichier
 */
export const downloadReceipt = (doc, studentName, paymentDate) => {
  const fileName = `Recu_${studentName.replace(/\s+/g, '_')}_${format(new Date(paymentDate), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}

/**
 * Génère un lien WhatsApp pour partager le reçu
 * @param {Object} payment - Données du paiement
 * @param {Object} student - Données de l'étudiant
 * @returns {string} - URL WhatsApp
 */
export const generateWhatsAppLink = (payment, student) => {
  const receiptNumber = generateReceiptNumber(payment.id)
  const message = `Bonjour,\n\nReçu de paiement - ${student.nom} ${student.prenom || ''}\n\n` +
    `N° Reçu: ${receiptNumber}\n` +
    `Montant: ${formatCurrency(payment.montant_total)}\n` +
    `Période: ${formatDateFrench(payment.date_debut)} - ${formatDateFrench(payment.date_fin)}\n\n` +
    `Merci pour votre confiance.\n\nEMSP`
  
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
