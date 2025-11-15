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
      width: 150,
      margin: 1,
      color: {
        dark: '#2D5016',
        light: '#FFFFFF'
      }
    })
    
    return qrDataUrl
  } catch (error) {
    console.error('Erreur génération QR code:', error)
    return null
  }
}

/**
 * Génère un reçu PDF simple et élégant
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
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)

  // Couleurs EMSP
  const emspGreen = '#2D5016'
  const emspYellow = '#FDB913'

  let yPosition = margin

  // ============================================
  // HEADER - Logo et Titre (Simple et Élégant)
  // ============================================
  
  // Essayer de charger le logo réel
  try {
    const logoUrl = '/images/logo-ecole.png'
    const logoImg = await loadImage(logoUrl)
    
    // Calculer la taille du logo (max 40mm de hauteur)
    const logoMaxHeight = 40
    const logoAspectRatio = logoImg.width / logoImg.height
    const logoHeight = logoMaxHeight
    const logoWidth = logoHeight * logoAspectRatio
    
    // Centrer le logo
    const logoX = (pageWidth - logoWidth) / 2
    
    doc.addImage(logoImg, 'PNG', logoX, yPosition, logoWidth, logoHeight)
    yPosition += logoHeight + 10
  } catch (error) {
    console.warn('Logo non trouvé, utilisation du placeholder')
    // Placeholder simple si le logo n'est pas trouvé
    doc.setFillColor(emspYellow)
    doc.circle(pageWidth / 2, yPosition + 15, 15, 'F')
    doc.setFillColor(emspGreen)
    doc.circle(pageWidth / 2, yPosition + 15, 12, 'F')
    doc.setTextColor('#FFFFFF')
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('EMSP', pageWidth / 2, yPosition + 18, { align: 'center' })
    yPosition += 40
  }

  // Titre principal
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text('REÇU DE PAIEMENT', pageWidth / 2, yPosition, { align: 'center' })

  // Numéro de reçu et date
  const receiptNumber = generateReceiptNumber(payment.id)
  const emissionDate = formatDateFrench(new Date().toISOString())
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#666666')
  doc.text(`N° ${receiptNumber}`, pageWidth / 2, yPosition + 5, { align: 'center' })
  doc.text(`Émis le ${emissionDate}`, pageWidth / 2, yPosition + 9, { align: 'center' })

  yPosition += 20

  // Ligne de séparation
  doc.setDrawColor(emspGreen)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // ============================================
  // INFORMATIONS ÉTUDIANT (Tableau simple)
  // ============================================
  const studentData = [
    ['Nom complet', `${student.nom} ${student.prenom || ''}`.trim()],
    ['Classe', student.classe || 'N/A'],
    ['Niveau', student.niveau || 'N/A'],
    ['Ligne de bus', student.lines?.nom || 'N/A'],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: false,
    body: studentData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: emspGreen },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  })

  yPosition = doc.lastAutoTable.finalY + 10

  // ============================================
  // DÉTAILS PAIEMENT (Tableau simple)
  // ============================================
  const paymentData = [
    ['Description', 'Quantité', 'Montant'],
    [
      'Abonnement transport',
      `${payment.nombre_mois} mois`,
      formatCurrency(payment.montant_total)
    ]
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [paymentData[0]],
    body: [paymentData[1]],
    theme: 'striped',
    headStyles: {
      fillColor: emspGreen,
      textColor: '#FFFFFF',
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  })

  yPosition = doc.lastAutoTable.finalY + 8

  // Total payé (mis en évidence)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text('TOTAL PAYÉ:', pageWidth - margin - 50, yPosition, { align: 'right' })
  doc.text(formatCurrency(payment.montant_total), pageWidth - margin, yPosition, { align: 'right' })

  yPosition += 15

  // Ligne de séparation
  doc.setDrawColor(emspGreen)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // ============================================
  // PÉRIODE COUVERTE (Simple)
  // ============================================
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text('Période couverte:', margin, yPosition)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#000000')
  doc.text(`Du ${formatDateFrench(payment.date_debut)} au ${formatDateFrench(payment.date_fin)}`, margin, yPosition + 5)

  yPosition += 15

  // ============================================
  // FOOTER - QR Code et Informations École
  // ============================================
  
  // QR Code (à gauche)
  const qrCodeSize = 25
  const qrCodeX = margin
  const qrCodeY = yPosition
  
  try {
    const qrCodeDataUrl = await generateQRCode(receiptNumber, payment.id)
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize)
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du QR code:', error)
  }

  // Informations école (à droite du QR code)
  const infoX = qrCodeX + qrCodeSize + 10
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#666666')
  
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(emspGreen)
  doc.text('École Multinationale Supérieure', infoX, qrCodeY)
  doc.text('des Postes d\'Abidjan', infoX, qrCodeY + 4)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#666666')
  doc.setFontSize(7)
  doc.text('18 BP 42 Abidjan 18', infoX, qrCodeY + 8)
  doc.text('Treichville, Zone 3, Km4', infoX, qrCodeY + 11)
  doc.text('+225 27 21 21 45 60', infoX, qrCodeY + 14)
  doc.text('contact@emsp.int', infoX, qrCodeY + 17)

  // Signature (en bas à droite)
  const signatureY = pageHeight - margin - 15
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#000000')
  doc.text('L\'Administration EMSP', pageWidth - margin, signatureY, { align: 'right' })
  
  // Ligne de signature
  doc.setDrawColor('#000000')
  doc.setLineWidth(0.5)
  doc.line(pageWidth - margin - 40, signatureY + 3, pageWidth - margin, signatureY + 3)

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
