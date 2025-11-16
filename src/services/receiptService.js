import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import { format } from 'date-fns'
import { formatCurrency } from '../utils/format'

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
 * Génère un reçu PDF moderne et professionnel avec design amélioré
 * @param {Object} payment - Données du paiement
 * @param {Object} student - Données de l'étudiant
 * @returns {Promise<jsPDF>} - Document PDF généré
 */
export const generateReceiptPDF = async (payment, student) => {
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

  // Convertir les couleurs hex en RGB
  const greenRgb = hexToRgb(emspGreen)
  const yellowRgb = hexToRgb(emspYellow)
  const lightGreenRgb = hexToRgb(emspLightGreen)

  let yPosition = margin

  // ============================================
  // HEADER - Design moderne avec bande colorée
  // ============================================
  
  // Bande de couleur en haut (gradient simulé)
  doc.setFillColor(greenRgb.r, greenRgb.g, greenRgb.b)
  doc.rect(0, 0, pageWidth, 25, 'F')
  
  // Deuxième bande (jaune)
  doc.setFillColor(yellowRgb.r, yellowRgb.g, yellowRgb.b)
  doc.rect(0, 25, pageWidth, 8, 'F')
  
  // Logo ou placeholder
  yPosition = 35
  try {
    const logoUrl = '/images/logo-ecole.png'
    const logoImg = await loadImage(logoUrl)
    
    const logoMaxHeight = 25
    const logoAspectRatio = logoImg.width / logoImg.height
    const logoHeight = logoMaxHeight
    const logoWidth = logoHeight * logoAspectRatio
    const logoX = (pageWidth - logoWidth) / 2
    
    doc.addImage(logoImg, 'PNG', logoX, 5, logoWidth, logoHeight)
  } catch (error) {
    // Logo stylisé si non trouvé
    doc.setFillColor(yellowRgb.r, yellowRgb.g, yellowRgb.b)
    doc.circle(pageWidth / 2, 17, 8, 'F')
    doc.setFillColor(greenRgb.r, greenRgb.g, greenRgb.b)
    doc.circle(pageWidth / 2, 17, 6, 'F')
    doc.setTextColor('#FFFFFF')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('EMSP', pageWidth / 2, 19, { align: 'center' })
  }

  // Titre principal (dans la bande verte)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#FFFFFF')
  doc.text('REÇU DE PAIEMENT', pageWidth / 2, 18, { align: 'center' })

  yPosition = 50

  // Numéro de reçu dans un encadré
  const receiptNumber = generateReceiptNumber(payment.id)
  const emissionDate = formatDateFrench(new Date().toISOString())
  
  // Fond gris clair pour le numéro de reçu
  doc.setFillColor(grayLight.replace('#', '').substring(0, 2) || 245, 245, 245)
  doc.setDrawColor(greenRgb.r, greenRgb.g, greenRgb.b)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, yPosition, contentWidth, 15, 3, 3, 'FD')
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text(`N° ${receiptNumber}`, margin + 5, yPosition + 8)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayDark)
  doc.text(`Émis le ${emissionDate}`, pageWidth - margin - 5, yPosition + 8, { align: 'right' })

  yPosition += 22

  // ============================================
  // INFORMATIONS ÉTUDIANT - Carte moderne
  // ============================================
  
  // Titre de section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text('INFORMATIONS ÉTUDIANT', margin, yPosition)
  
  yPosition += 8

  // Carte avec fond coloré léger
  doc.setFillColor(lightGreenRgb.r, lightGreenRgb.g, lightGreenRgb.b)
  doc.setGState(doc.GState({ opacity: 0.1 }))
  doc.roundedRect(margin, yPosition, contentWidth, 35, 5, 5, 'F')
  doc.setGState(doc.GState({ opacity: 1 }))

  const studentData = [
    ['Nom complet', `${student.nom} ${student.prenom || ''}`.trim()],
    ['Classe', student.classe || 'N/A'],
    ['Niveau', student.niveau || 'N/A'],
    ['Ligne de car', student.lines?.nom || 'N/A'],
  ]

  autoTable(doc, {
    startY: yPosition + 3,
    head: false,
    body: studentData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 5,
      lineColor: [0, 0, 0, 0], // Pas de bordures visibles
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 50, 
        textColor: [greenRgb.r, greenRgb.g, greenRgb.b],
        font: 'helvetica',
      },
      1: { 
        cellWidth: 'auto',
        textColor: grayDark,
      },
    },
    margin: { left: margin + 3, right: margin + 3 },
    tableLineColor: [0, 0, 0, 0],
    tableLineWidth: 0,
  })

  yPosition = doc.lastAutoTable.finalY + 15

  // ============================================
  // DÉTAILS PAIEMENT - Tableau moderne
  // ============================================
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text('DÉTAILS DU PAIEMENT', margin, yPosition)
  
  yPosition += 8

  const paymentData = [
    ['Description', 'Quantité', 'Montant unitaire', 'Montant total'],
    [
      'Abonnement transport scolaire',
      `${payment.nombre_mois} mois`,
      formatCurrency(payment.montant_total / payment.nombre_mois),
      formatCurrency(payment.montant_total)
    ]
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [paymentData[0]],
    body: [paymentData[1]],
    theme: 'striped',
    headStyles: {
      fillColor: [greenRgb.r, greenRgb.g, greenRgb.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 6,
      textColor: grayDark,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [greenRgb.r, greenRgb.g, greenRgb.b] },
    },
    margin: { left: margin, right: margin },
  })

  yPosition = doc.lastAutoTable.finalY + 12

  // Encadré pour le total avec style moderne
  doc.setFillColor(greenRgb.r, greenRgb.g, greenRgb.b)
  doc.roundedRect(margin, yPosition, contentWidth, 18, 5, 5, 'F')
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#FFFFFF')
  doc.text('TOTAL PAYÉ', margin + 10, yPosition + 8)
  doc.text(formatCurrency(payment.montant_total), pageWidth - margin - 10, yPosition + 8, { align: 'right' })

  yPosition += 25

  // ============================================
  // PÉRIODE COUVERTE - Design moderne
  // ============================================
  
  doc.setFillColor([lightGreenRgb.r, lightGreenRgb.g, lightGreenRgb.b])
  doc.setGState(doc.GState({ opacity: 0.15 }))
  doc.roundedRect(margin, yPosition, contentWidth, 25, 5, 5, 'F')
  doc.setGState(doc.GState({ opacity: 1 }))

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text('PÉRIODE COUVERTE', margin + 5, yPosition + 8)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayDark)
  
  const startDate = formatDateFrench(payment.date_debut)
  const endDate = formatDateFrench(payment.date_fin)
  
  doc.text(`Du ${startDate}`, margin + 5, yPosition + 14)
  doc.text(`Au ${endDate}`, margin + 5, yPosition + 19)
  
  // Icône de calendrier (simulée avec texte)
  doc.setFontSize(8)
  doc.setTextColor(grayMedium)
  doc.text('📅', pageWidth - margin - 30, yPosition + 14)

  yPosition += 32

  // ============================================
  // FOOTER - QR Code et Informations (Design moderne)
  // ============================================
  
  // Séparateur décoratif
  doc.setDrawColor(yellowRgb.r, yellowRgb.g, yellowRgb.b)
  doc.setLineWidth(2)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 8

  // QR Code dans un encadré moderne
  const qrCodeSize = 40
  const qrCodeX = margin
  const qrCodeY = yPosition
  
  // Encadré pour le QR code
  doc.setFillColor(grayLight)
  doc.setDrawColor(greenRgb.r, greenRgb.g, greenRgb.b)
  doc.setLineWidth(1)
  doc.roundedRect(qrCodeX, qrCodeY, qrCodeSize + 4, qrCodeSize + 20, 3, 3, 'FD')
  
  try {
    const qrCodeDataUrl = await generateQRCode(receiptNumber, payment.id)
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX + 2, qrCodeY + 2, qrCodeSize, qrCodeSize)
      
      // Texte sous le QR code
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(grayDark)
      doc.text('Scanner pour vérifier', qrCodeX + qrCodeSize / 2 + 2, qrCodeY + qrCodeSize + 10, { align: 'center' })
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du QR code:', error)
  }

  // Informations école dans un encadré moderne
  const infoX = qrCodeX + qrCodeSize + 15
  const infoWidth = pageWidth - infoX - margin
  const infoY = qrCodeY
  
  // Encadré pour les informations
  doc.setFillColor(grayLight)
  doc.setDrawColor(greenRgb.r, greenRgb.g, greenRgb.b)
  doc.setLineWidth(1)
  doc.roundedRect(infoX, infoY, infoWidth, qrCodeSize + 20, 3, 3, 'FD')
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text('École Multinationale Supérieure', infoX + 3, infoY + 6)
  doc.text('des Postes d\'Abidjan', infoX + 3, infoY + 11)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(grayDark)
  doc.text('📍 18 BP 42 Abidjan 18', infoX + 3, infoY + 17)
  doc.text('Treichville, Zone 3, Km4', infoX + 3, infoY + 22)
  doc.text('📞 +225 27 21 21 45 60', infoX + 3, infoY + 27)
  doc.text('✉️ contact@emsp.int', infoX + 3, infoY + 32)

  // Signature (en bas)
  const signatureY = pageHeight - margin - 25
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(grayDark)
  doc.text('L\'Administration EMSP', pageWidth - margin, signatureY, { align: 'right' })
  
  // Ligne de signature avec style
  doc.setDrawColor(greenRgb.r, greenRgb.g, greenRgb.b)
  doc.setLineWidth(1)
  doc.line(pageWidth - margin - 50, signatureY + 3, pageWidth - margin, signatureY + 3)

  // Numéro de page (si plusieurs pages)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayMedium)
  doc.text(`Page 1/1`, pageWidth / 2, pageHeight - 10, { align: 'center' })

  return doc
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
