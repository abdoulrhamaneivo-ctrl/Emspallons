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
    // HEADER - Design moderne avec bande colorée
    // ============================================
    
    // Bande verte en haut (header principal)
    doc.setFillColor(gRgb.r, gRgb.g, gRgb.b)
    doc.rect(0, 0, pageWidth, 30, 'F')
    
    // Logo (si disponible) - Positionné AVANT le titre pour éviter superposition
    try {
      const logoUrl = '/images/logo-ecole.png'
      const logoImg = await loadImage(logoUrl)
      
      const logoMaxHeight = 20
      const logoAspectRatio = logoImg.width / logoImg.height
      const logoHeight = logoMaxHeight
      const logoWidth = logoHeight * logoAspectRatio
      const logoX = margin + 5
      const logoY = 5
      
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight)
    } catch (error) {
      // Logo stylisé si non trouvé - positionné à gauche
      doc.setFillColor(yRgb.r, yRgb.g, yRgb.b)
      doc.circle(margin + 15, 15, 6, 'F')
      doc.setFillColor(255, 255, 255)
      doc.circle(margin + 15, 15, 4, 'F')
      doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('EMSP', margin + 15, 17, { align: 'center' })
    }
  
    // Titre principal (dans la bande verte) - Centré et bien espacé
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('REÇU DE PAIEMENT', pageWidth / 2, 18, { align: 'center' })
    
    // Deuxième bande (jaune) - Séparée du header
    doc.setFillColor(yRgb.r, yRgb.g, yRgb.b)
    doc.rect(0, 30, pageWidth, 5, 'F')
  
    yPosition = 45 // Espacement après le header
  
    // Numéro de reçu dans un encadré - Espacement amélioré
    const receiptNumber = generateReceiptNumber(payment.id)
    const emissionDate = formatDateFrench(new Date().toISOString())
    
    // Fond gris clair pour le numéro de reçu - Hauteur augmentée
    doc.setFillColor(glRgb.r, glRgb.g, glRgb.b)
    doc.setDrawColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPosition, contentWidth, 12, 3, 3, 'FD')
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text(`N° ${receiptNumber}`, margin + 5, yPosition + 7)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text(`Émis le ${emissionDate}`, pageWidth - margin - 5, yPosition + 7, { align: 'right' })
  
    yPosition += 18 // Espacement après le numéro de reçu
  
    // ============================================
    // INFORMATIONS ÉTUDIANT - Carte moderne
    // ============================================
    
    // Titre de section - Espacement amélioré
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('INFORMATIONS ÉTUDIANT', margin, yPosition)
    
    yPosition += 7 // Espacement avant la carte
  
    // Carte avec fond coloré léger - Hauteur ajustée
    doc.setFillColor(lgRgb.r, lgRgb.g, lgRgb.b)
    doc.setGState(doc.GState({ opacity: 0.1 }))
    doc.roundedRect(margin, yPosition, contentWidth, 32, 5, 5, 'F')
    doc.setGState(doc.GState({ opacity: 1 }))
  
    const studentData = [
      ['Nom complet', `${student.nom} ${student.prenom || ''}`.trim()],
      ['Classe', student.classe || 'N/A'],
      ['Niveau', student.niveau || 'N/A'],
      ['Ligne de car', student.lines?.nom || 'N/A'],
    ]
  
    // Utiliser setTextColor avant autoTable
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    autoTable(doc, {
      startY: yPosition + 2,
      head: false,
      body: studentData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [0, 0, 0, 0], // Pas de bordures visibles
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          cellWidth: 45,
          font: 'helvetica',
        },
        1: { 
          cellWidth: 'auto',
        },
      },
      margin: { left: margin + 3, right: margin + 3 },
      tableLineColor: [0, 0, 0, 0],
      tableLineWidth: 0,
    })
    
    // Redessiner la colonne 0 (labels) en vert après autoTable
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const tableStartY = yPosition + 2
    studentData.forEach((row, index) => {
      const rowY = tableStartY + (index * 7) + 6 // Espacement entre lignes augmenté
      doc.text(row[0] || '', margin + 3, rowY)
    })
    // Remettre la couleur normale pour la suite
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.setFont('helvetica', 'normal')
  
    yPosition = doc.lastAutoTable.finalY + 12 // Espacement après la section
  
    // ============================================
    // DÉTAILS PAIEMENT - Tableau moderne
    // ============================================
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('DÉTAILS DU PAIEMENT', margin, yPosition)
    
    yPosition += 7 // Espacement avant le tableau
  
    const paymentData = [
      ['Description', 'Quantité', 'Montant unitaire', 'Montant total'],
      [
        'Abonnement transport scolaire',
        `${payment.nombre_mois} mois`,
        formatCurrency(payment.montant_total / payment.nombre_mois).replace(' FCFA', ' F'),
        formatCurrency(payment.montant_total).replace(' FCFA', ' F')
      ]
    ]
  
    // Définir les couleurs avant autoTable
    doc.setFillColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setTextColor(255, 255, 255)
    autoTable(doc, {
      startY: yPosition,
      head: [paymentData[0]],
      body: [paymentData[1]],
      theme: 'striped',
      headStyles: {
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 5,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    })
    // Remettre la couleur du texte normale après autoTable
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    // Redessiner la colonne 3 (montant total) en vert
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const paymentTableY = yPosition
    const bodyRowY = paymentTableY + 8 + 5 // Hauteur header + padding ajustés
    doc.text(paymentData[1][3] || '', pageWidth - margin - 35, bodyRowY, { align: 'right' })
    // Remettre la couleur normale
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
  
    yPosition = doc.lastAutoTable.finalY + 10 // Espacement après le tableau
  
    // Encadré pour le total avec style moderne - Espacement amélioré
    doc.setFillColor(gRgb.r, gRgb.g, gRgb.b)
    doc.roundedRect(margin, yPosition, contentWidth, 12, 5, 5, 'F')
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL PAYÉ', margin + 8, yPosition + 7)
    const totalAmount = formatCurrency(payment.montant_total).replace(' FCFA', ' F')
    doc.text(totalAmount, pageWidth - margin - 8, yPosition + 7, { align: 'right' })
  
    yPosition += 18 // Espacement après le total
  
    // ============================================
    // PÉRIODE COUVERTE - Design moderne
    // ============================================
    
    doc.setFillColor(lgRgb.r, lgRgb.g, lgRgb.b)
    doc.setGState(doc.GState({ opacity: 0.15 }))
    doc.roundedRect(margin, yPosition, contentWidth, 20, 5, 5, 'F')
    doc.setGState(doc.GState({ opacity: 1 }))
  
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('PÉRIODE COUVERTE', margin + 5, yPosition + 6)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    
    const startDate = formatDateFrench(payment.date_debut)
    const endDate = formatDateFrench(payment.date_fin)
    
    doc.text(`Du ${startDate}`, margin + 5, yPosition + 11)
    doc.text(`Au ${endDate}`, margin + 5, yPosition + 16)
  
    yPosition += 25 // Espacement après la période
  
    // ============================================
    // FOOTER - QR Code et Informations (Design moderne)
    // ============================================
    
    // Séparateur décoratif - Bande jaune
    doc.setFillColor(yRgb.r, yRgb.g, yRgb.b)
    doc.rect(0, yPosition, pageWidth, 3, 'F')
    
    yPosition += 8 // Espacement après le séparateur
  
    // QR Code dans un encadré moderne - Taille réduite pour éviter superposition
    const qrCodeSize = 35
    const qrCodeX = margin
    const qrCodeY = yPosition
    
    // Encadré pour le QR code
    doc.setFillColor(glRgb.r, glRgb.g, glRgb.b)
    doc.setDrawColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setLineWidth(1)
    doc.roundedRect(qrCodeX, qrCodeY, qrCodeSize + 4, qrCodeSize + 12, 3, 3, 'FD')
    
    try {
      const qrCodeDataUrl = await generateQRCode(receiptNumber, payment.id)
      if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX + 2, qrCodeY + 2, qrCodeSize, qrCodeSize)
        
        // Texte sous le QR code
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
        doc.text('Scanner pour vérifier', qrCodeX + qrCodeSize / 2 + 2, qrCodeY + qrCodeSize + 8, { align: 'center' })
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du QR code:', error)
    }
  
    // Informations école dans un encadré moderne - Espacement amélioré
    const infoX = qrCodeX + qrCodeSize + 10
    const infoWidth = pageWidth - infoX - margin
    const infoY = qrCodeY
    
    // Encadré pour les informations
    doc.setFillColor(glRgb.r, glRgb.g, glRgb.b)
    doc.setDrawColor(gRgb.r, gRgb.g, gRgb.b)
    doc.setLineWidth(1)
    doc.roundedRect(infoX, infoY, infoWidth, qrCodeSize + 12, 3, 3, 'FD')
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gRgb.r, gRgb.g, gRgb.b)
    doc.text('École Multinationale Supérieure', infoX + 3, infoY + 5)
    doc.text('des Postes d\'Abidjan', infoX + 3, infoY + 9)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text('18 BP 42 Abidjan 18', infoX + 3, infoY + 13)
    doc.text('Treichville, Zone 3, Km4', infoX + 3, infoY + 17)
    doc.text('+225 27 21 21 45 60', infoX + 3, infoY + 21)
    doc.text('contact@emsp.int', infoX + 3, infoY + 25)
  
    // Signature (en bas) - Position ajustée
    const signatureY = pageHeight - margin - 20
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gdRgb.r, gdRgb.g, gdRgb.b)
    doc.text('L\'Administration EMSP', pageWidth - margin, signatureY, { align: 'right' })
    
    // Ligne de signature avec style
    hr(doc, signatureY + 3, { r: gRgb.r, g: gRgb.g, b: gRgb.b }, 1, pageWidth - margin - 50, pageWidth - margin)
  
    // Numéro de page (si plusieurs pages)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gmRgb.r, gmRgb.g, gmRgb.b)
    doc.text(`Page 1/1`, pageWidth / 2, pageHeight - 8, { align: 'center' })

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
