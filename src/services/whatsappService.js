/**
 * Service pour l'envoi de rappels via WhatsApp
 */

/**
 * Nettoie un numéro de téléphone pour WhatsApp
 * @param {string} contact - Numéro de téléphone
 * @returns {string} - Numéro nettoyé
 */
export const cleanPhoneNumber = (contact) => {
  if (!contact) return ''
  // Retirer tous les caractères non numériques
  return contact.replace(/[^0-9]/g, '')
}

/**
 * Génère un lien WhatsApp Web pour un contact et un message
 * @param {string} contact - Numéro de téléphone
 * @param {string} message - Message à envoyer
 * @returns {string} - Lien WhatsApp
 */
export const generateWhatsAppLink = (contact, message) => {
  const cleanContact = cleanPhoneNumber(contact)
  if (!cleanContact) {
    throw new Error('Numéro de téléphone invalide')
  }
  
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanContact}?text=${encodedMessage}`
}

/**
 * Remplace les variables dans un template de message
 * @param {string} template - Template avec variables {variable}
 * @param {Object} data - Données pour remplacer les variables
 * @returns {string} - Message avec variables remplacées
 */
export const replaceTemplateVariables = (template, data) => {
  let message = template
  
  // Variables disponibles
  const variables = {
    tuteur: data.tuteur || 'Parent',
    nom_etudiant: data.nom_etudiant || '',
    prenom_etudiant: data.prenom_etudiant || '',
    classe: data.classe || '',
    ligne: data.ligne || '',
    date_expiration: data.date_expiration || '',
    montant: data.montant || '0',
    jours_restants: data.jours_restants || '0',
  }
  
  // Remplacer toutes les variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    message = message.replace(regex, variables[key])
  })
  
  return message
}

/**
 * Envoie des rappels par batch (50 par 50)
 * @param {Array} recipients - Liste des destinataires [{contact, data, ...}]
 * @param {string} messageTemplate - Template de message
 * @param {Function} onProgress - Callback de progression (progress, current, total)
 * @returns {Promise<{success: number, errors: Array}>}
 */
export const sendBatchReminders = async (recipients, messageTemplate, onProgress) => {
  const results = {
    success: 0,
    errors: [],
    links: [], // Pour l'instant, on génère juste les liens
  }
  
  const batchSize = 50
  const total = recipients.length
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    
    // Traiter chaque destinataire du batch
    for (const recipient of batch) {
      try {
        // Remplacer les variables dans le message
        const message = replaceTemplateVariables(messageTemplate, recipient)
        
        // Générer le lien WhatsApp
        const link = generateWhatsAppLink(recipient.contact, message)
        
        results.links.push({
          contact: recipient.contact,
          name: `${recipient.nom_etudiant || ''} ${recipient.prenom_etudiant || ''}`.trim(),
          link,
          message,
        })
        
        results.success++
      } catch (error) {
        results.errors.push({
          contact: recipient.contact,
          name: `${recipient.nom_etudiant || ''} ${recipient.prenom_etudiant || ''}`.trim(),
          error: error.message || 'Erreur inconnue',
        })
      }
    }
    
    // Appeler le callback de progression
    if (onProgress) {
      onProgress({
        current: Math.min(i + batchSize, total),
        total,
        percentage: Math.round(((i + batchSize) / total) * 100),
      })
    }
    
    // Attendre 2 secondes entre les batches (rate limiting)
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  return results
}

/**
 * Ouvre un lien WhatsApp dans un nouvel onglet
 * @param {string} link - Lien WhatsApp
 */
export const openWhatsAppLink = (link) => {
  window.open(link, '_blank')
}

/**
 * Ouvre plusieurs liens WhatsApp (batch)
 * @param {Array} links - Liste de liens
 * @param {number} delay - Délai entre chaque ouverture (ms)
 */
export const openBatchWhatsAppLinks = async (links, delay = 1000) => {
  for (let i = 0; i < links.length; i++) {
    openWhatsAppLink(links[i].link)
    
    // Attendre avant d'ouvrir le suivant (pour éviter le blocage du navigateur)
    if (i < links.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

