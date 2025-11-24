import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import { format } from 'date-fns'
import { formatCurrency } from '../lib/utils'

// Formatter sûr pour jsPDF: évite les espaces insécables et symboles non supportés
const formatCurrencyPdf = (amount) => {
  const a = (amount === null || amount === undefined) ? 0 : amount
  const numeric = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(a)
  // Remplacer NBSP (\u00A0) et NNBSP (\u202F) par espace normal
  return `${numeric}`.replace(/[\u00A0\u202F]/g, ' ') + ' FCFA'
}

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
    const margin = 20
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
    // HEADER PROFESSIONNEL AVEC BANDEAU
    // ============================================
    
    // Bandeau coloré en haut
    doc.setFillColor(gRgb.r, gRgb.g, gRgb.b)
    doc.rect(0, 0, pageWidth, 35, 'F')
    
    // Titre principal dans le bandeau
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('REÇU DE PAIEMENT', pageWidth / 2, 20, { align: 'center' })
    
    // Sous-titre
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text('École Multinationale Supérieure des Postes', pageWidth / 2, 27, { align: 'center' })
    
    yPosition = 45
  
    // Numéro de reçu et date dans un encadré
    const receiptNumber = generateReceiptNumber(payment.id)
    const emissionDate = formatDateFrench(new Date().toISOString())
    
    // Encadré pour le numéro de reçu
    doc.setDrawColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setFillColor(glRgb.r, glRgb.g, glRgb.b)
    doc.roundedRect(margin, yPosition - 8, contentWidth, 12, 2, 2, 'FD')
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text(`N° ${receiptNumber}`, margin + 5, yPosition)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text(`Émis le ${emissionDate}`, pageWidth - margin - 5, yPosition, { align: 'right' })
  
    yPosition += 20
  
    // ============================================
    // INFORMATIONS ÉTUDIANT - DESIGN AMÉLIORÉ
    // ============================================
    
    // Titre de section avec ligne décorative
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('INFORMATIONS ÉTUDIANT', margin, yPosition)
    
    // Ligne décorative sous le titre
    hr(doc, yPosition + 3, { r: gRgb.r, g: gRgb.g, b: gRgb.b }, 2, margin, margin + 60)
    
    yPosition += 10
    
    // Encadré pour les informations étudiant
    doc.setDrawColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPosition - 8, contentWidth, 30, 3, 3, 'D')
    
    let studentInfoY = yPosition
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text(`Nom complet :`, margin + 5, studentInfoY)
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text(`${student.nom} ${student.prenom || ''}`.trim(), margin + 45, studentInfoY)
    
    studentInfoY += 7
    doc.setFont('helvetica', 'bold')
    doc.text(`Classe :`, margin + 5, studentInfoY)
    doc.setFont('helvetica', 'normal')
    doc.text(`${student.classe || 'N/A'}`, margin + 45, studentInfoY)
    
    studentInfoY += 7
    doc.setFont('helvetica', 'bold')
    doc.text(`Ligne de transport :`, margin + 5, studentInfoY)
    doc.setFont('helvetica', 'normal')
    doc.text(`${student.lines?.nom || 'N/A'}`, margin + 45, studentInfoY)
    
    if (student.contact) {
      studentInfoY += 7
      doc.setFont('helvetica', 'bold')
      doc.text(`Contact :`, margin + 5, studentInfoY)
      doc.setFont('helvetica', 'normal')
      doc.text(`${student.contact}`, margin + 45, studentInfoY)
    }
    
    yPosition = studentInfoY + 15
  
    // ============================================
    // DÉTAILS PAIEMENT - TABLEAU PROFESSIONNEL
    // ============================================
    
    // Titre de section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('DÉTAILS DU PAIEMENT', margin, yPosition)
    
    // Ligne décorative
    hr(doc, yPosition + 3, { r: gRgb.r, g: gRgb.g, b: gRgb.b }, 2, margin, margin + 65)
    
    yPosition += 10
    
    // Tableau professionnel avec autoTable
    const tableData = [
      ['Description', 'Quantité', 'Prix unitaire', 'Montant'],
      [
        'Abonnement transport scolaire',
        `${payment.nombre_mois} mois`,
        formatCurrencyPdf(payment.montant_mensuel || (payment.nombre_mois ? (payment.montant_total / payment.nombre_mois) : payment.montant_total)),
        formatCurrencyPdf(payment.montant_total)
      ]
    ]
    
    autoTable(doc, {
      startY: yPosition,
      head: [tableData[0]],
      body: [tableData[1]],
      theme: 'striped',
      headStyles: {
        fillColor: [gRgb.r, gRgb.g, gRgb.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        textColor: [gdRgb.r, gdRgb.g, gdRgb.b],
        fontSize: 10,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [glRgb.r, glRgb.g, glRgb.b]
      },
      styles: {
        cellPadding: 5,
        lineWidth: 0.5,
        lineColor: [gRgb.r, gRgb.g, gRgb.b]
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    })
    
    yPosition = doc.lastAutoTable.finalY + 10
    
    // Encadré pour le total avec accentuation
    doc.setFillColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setDrawColor(gRgb.r, gRgb.g, gRgb.b)
    doc.roundedRect(margin, yPosition, contentWidth, 15, 3, 3, 'FD')
    
    const totalAmount = formatCurrencyPdf(payment.montant_total)
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL À PAYER', margin + contentWidth / 2 - 30, yPosition + 10, { align: 'left' })
    doc.text(totalAmount, pageWidth - margin - 5, yPosition + 10, { align: 'right' })
  
    yPosition += 20
  
    // ============================================
    // PÉRIODE COUVERTE - DESIGN AMÉLIORÉ
    // ============================================
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('PÉRIODE D\'ABONNEMENT', margin, yPosition)
    
    hr(doc, yPosition + 3, { r: gRgb.r, g: gRgb.g, b: gRgb.b }, 2, margin, margin + 70)
    
    yPosition += 10
    
    // Encadré pour la période
    doc.setDrawColor(lgRgb.r, lgRgb.g, lgRgb.b)
    doc.setFillColor(glRgb.r, glRgb.g, glRgb.b)
    doc.roundedRect(margin, yPosition - 8, contentWidth, 12, 3, 3, 'FD')
    
    const startDate = formatDateFrench(payment.date_debut)
    const endDate = formatDateFrench(payment.date_fin)
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text(`Du ${startDate} au ${endDate}`, margin + 5, yPosition)
    
    // Indication du nombre de mois
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text(`(${payment.nombre_mois} mois)`, pageWidth - margin - 5, yPosition, { align: 'right' })
  
    yPosition += 15
  
    // ============================================
    // FOOTER PROFESSIONNEL AVEC COORDONNÉES
    // ============================================
    
    // Ligne de séparation épaisse
    hr(doc, yPosition, { r: gRgb.r, g: gRgb.g, b: gRgb.b }, 1.5, margin, pageWidth - margin)
    
    yPosition += 10
  
    // Zone signature
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    
    // Signature à droite
    doc.text('Pour l\'Administration EMSP,', pageWidth - margin, yPosition, { align: 'right' })
    yPosition += 12
    hr(doc, yPosition, { r: gRgb.r, g: gRgb.g, b: gRgb.b }, 0.5, pageWidth - margin - 60, pageWidth - margin)
    yPosition += 7
    doc.setFont('helvetica', 'bold')
    doc.text('Signature et cachet', pageWidth - margin, yPosition, { align: 'right' })
    
    yPosition += 15
    
    // Coordonnées EMSP
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gmRgb.r, gmRgb.g, gmRgb.b)
    
    doc.text('EMSP - École Multinationale Supérieure des Postes', margin, yPosition)
    yPosition += 4
    doc.text('Adresse : Abidjan, Côte d\'Ivoire', margin, yPosition)
    yPosition += 4
    doc.text('Email : contact@emsp.ci | Téléphone : +225 XX XX XX XX XX', margin, yPosition)
    
    yPosition += 10
    
    // Note légale
    doc.setFontSize(7)
    doc.setTextColor(gmRgb.r, gmRgb.g, gmRgb.b)
    doc.text('Ce reçu est une pièce justificative officielle de paiement. À conserver précieusement.', margin, yPosition, { 
      maxWidth: contentWidth,
      align: 'justify'
    })

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
 * @returns {string} - URL WhatsApp avec le numéro de l'étudiant
 */
export const generateWhatsAppLink = (payment, student) => {
  if (!student?.contact) {
    throw new Error('Contact de l\'étudiant non disponible')
  }

  // Nettoyer le numéro de téléphone (retirer tous les caractères non numériques)
  const cleanPhone = student.contact.replace(/\D/g, '')
  
  if (!cleanPhone) {
    throw new Error('Numéro de téléphone invalide')
  }

  const receiptNumber = generateReceiptNumber(payment.id)
  const message = `Bonjour ${student.prenom || ''} ${student.nom},\n\n` +
    `✅ Votre paiement a été enregistré avec succès !\n\n` +
    `📄 N° Reçu: ${receiptNumber}\n` +
    `💰 Montant: ${formatCurrency(payment.montant_total)}\n` +
    `📅 Période: ${formatDateFrench(payment.date_debut)} - ${formatDateFrench(payment.date_fin)}\n` +
    `📆 Mois couverts: ${payment.nombre_mois} mois\n\n` +
    `Votre reçu est disponible sur la plateforme.\n\n` +
    `Merci de votre confiance.\n\n` +
    `École EMSP`
  
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}
