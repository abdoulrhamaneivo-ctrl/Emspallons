import { supabase } from '../lib/supabase'
import logger from '../lib/logger'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, formatMonthFrench } from '../lib/utils'

/**
 * Envoi automatique via WhatsApp (utilise l'API WhatsApp Business ou Twilio)
 */

// Configuration API WhatsApp
// URL par défaut pour WhatsApp Business Cloud API
const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
const WHATSAPP_API_KEY = import.meta.env.VITE_WHATSAPP_API_KEY

/**
 * Envoie le reçu PDF par WhatsApp après paiement
 */
export async function sendPaymentConfirmationWhatsApp(studentId, paymentId) {
  try {
    // 1. Récupérer l'étudiant
    const { data: student } = await supabase
      .from('students')
      .select('nom, prenom, contact')
      .eq('id', studentId)
      .single()

    // 2. Récupérer le paiement
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (!student || !payment) {
      throw new Error('Étudiant ou paiement introuvable')
    }

    // 3. Générer le message
    const message = `Bonjour ${student.prenom || ''} ${student.nom},

✅ Votre paiement a été enregistré avec succès !

💰 Montant : ${formatCurrency(payment.montant_total)}
📅 Période : ${formatDate(payment.date_debut)} - ${formatDate(payment.date_fin)}
📆 Mois couverts : ${payment.nombre_mois} mois

Votre reçu est disponible sur la plateforme.

Merci de votre confiance.
École EMSP`

    // 4. Envoyer via WhatsApp
    await sendWhatsAppMessage(student.contact, message)

    logger.info('Confirmation paiement envoyée par WhatsApp', {
      student_id: studentId,
      payment_id: paymentId,
      contact: student.contact
    })

    return true

  } catch (error) {
    logger.error('Erreur envoi confirmation WhatsApp', error)
    // Ne pas bloquer le paiement si l'envoi échoue
    return false
  }
}

/**
 * Envoie le QR code par WhatsApp après génération
 */
export async function sendQRCodeWhatsApp(studentId) {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('nom, prenom, contact, months_ledger')
      .eq('id', studentId)
      .single()

    if (!student) throw new Error('Étudiant introuvable')

    // Calculer date d'expiration au format français
    const lastMonth = student.months_ledger?.[student.months_ledger.length - 1]
    let expirationText = 'Non défini'
    
    if (lastMonth) {
      try {
        expirationText = formatMonthFrench(lastMonth)
      } catch {
        expirationText = formatDate(new Date(lastMonth + '-01'))
      }
    }

    const message = `Bonjour ${student.prenom || ''} ${student.nom},

🎫 Votre QR Code de transport EMSP

Présentez ce code au contrôleur lors de l'embarquement.

📅 Valide jusqu'au : ${expirationText}

⚠️ En cas de perte, contactez l'administration.

École EMSP`

    await sendWhatsAppMessage(student.contact, message)

    logger.info('QR code envoyé par WhatsApp', {
      student_id: studentId,
      contact: student.contact
    })

    return true

  } catch (error) {
    logger.error('Erreur envoi QR code WhatsApp', error)
    return false
  }
}

/**
 * Envoie un message personnalisé par WhatsApp
 */
export async function sendWhatsAppMessage(phone, message) {
  return await sendWhatsAppMessageInternal(phone, message)
}

/**
 * Fonction générique d'envoi WhatsApp (interne)
 */
async function sendWhatsAppMessageInternal(phone, message, attachmentUrl = null) {
  // Nettoyer le numéro
  const cleanPhone = phone.replace(/\D/g, '')

  // OPTION 1 : Utiliser l'API WhatsApp Business Cloud (recommandé en production)
  if (WHATSAPP_API_KEY) {
    try {
      // Récupérer le Phone Number ID depuis les variables d'environnement
      const phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID
      
      if (!phoneNumberId) {
        throw new Error('VITE_WHATSAPP_PHONE_NUMBER_ID est requis pour utiliser l\'API WhatsApp Business')
      }
      
      // Construire l'URL de l'API WhatsApp Business Cloud
      const apiUrl = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        logger.error('Erreur API WhatsApp Business', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(`Erreur API WhatsApp: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      logger.info('Message WhatsApp envoyé avec succès', {
        to: cleanPhone,
        messageId: result.messages?.[0]?.id
      })

      return result

    } catch (error) {
      logger.error('Erreur API WhatsApp Business', error)
      throw error
    }
  }

  // OPTION 2 : Ouvrir WhatsApp Web (développement/fallback)
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
  
  // Ouvrir dans un nouvel onglet
  window.open(whatsappUrl, '_blank')
  
  toast.success('WhatsApp ouvert. Envoyez le message manuellement.')
  
  return { status: 'manual', url: whatsappUrl }
}

