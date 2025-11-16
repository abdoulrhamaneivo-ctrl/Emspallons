import { supabase } from '../lib/supabase'
import { format, parseISO, startOfMonth, isAfter, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import logger from '../lib/logger'

// Format de date français simple
const formatDateFrench = (dateString) => {
  try {
    const date = parseISO(dateString)
    const monthNames = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ]
    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return dateString
  }
}

// Formater le mois pour le nom du fichier (ex: "novembre 2026")
const formatMonthForFilename = (monthStr) => {
  try {
    // monthStr est au format "yyyy-MM"
    const date = parseISO(monthStr + '-01')
    return format(date, 'MMMM yyyy', { locale: fr })
  } catch {
    return monthStr
  }
}

/**
 * Vérifie si un paiement est anticipé (sessions futures)
 */
export const isPaymentAnticipated = (sessions) => {
  if (!sessions || sessions.length === 0) return false
  
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM')
  return sessions.some(session => session > currentMonth)
}

/**
 * Obtient les sessions futures d'un étudiant
 */
export const getFutureSessions = (monthsLedger) => {
  if (!monthsLedger || monthsLedger.length === 0) return []
  
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM')
  return monthsLedger.filter(session => session > currentMonth)
}

/**
 * Génère un bilan mensuel
 * Exclut automatiquement les mois hors service des bilans
 */
export const generateBilanMensuel = async (month, ligneId = null) => {
  try {
    // Formater le mois (YYYY-MM)
    const monthStr = format(parseISO(month), 'yyyy-MM')
    
    // Récupérer les mois hors service depuis settings
    let pausedMonths = []
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('paused_months')
        .limit(1)
        .single()
      
      if (settings?.paused_months) {
        pausedMonths = settings.paused_months
      }
    } catch (error) {
      logger.debug('Erreur récupération paused_months pour bilan', error)
      // Continuer même si on ne peut pas récupérer les mois hors service
    }
    
    // Vérifier si le mois sélectionné est un mois hors service
    if (pausedMonths.includes(monthStr)) {
      logger.info('Mois sélectionné est hors service', { month: monthStr })
      // Retourner un bilan vide pour les mois hors service
      return {
        month: monthStr,
        students: [],
        payments: [],
        stats: {
          totalStudents: 0,
          totalPayments: 0,
          totalEncaisse: 0,
          montantMoyen: 0,
        },
        pausedMonth: true
      }
    }
    
    // CHANGEMENT IMPORTANT : Charger TOUS les étudiants, pas seulement ceux qui ont payé pour ce mois
    // Le bilan mensuel doit afficher tous les étudiants avec leur statut pour le mois sélectionné
    let query = supabase
      .from('students')
      .select(`
        id,
        nom,
        prenom,
        classe,
        niveau,
        contact,
        months_ledger,
        statut_paiement,
        ligne_id,
        lines:ligne_id (
          id,
          nom,
          couleur
        )
      `)
    
    // Filtrer par ligne si spécifiée
    if (ligneId) {
      query = query.eq('ligne_id', ligneId)
    }
    
    const { data: students, error } = await query
    
    if (error) throw error
    
    // Optimisation: Récupérer tous les paiements en une seule requête
    const studentIds = (students || []).map(s => s.id)
    let paymentsMap = new Map()
    let lastPaymentsMap = new Map()
    let allPaymentsData = [] // Stocker pour le calcul du total_encaisse_mois
    
    if (studentIds.length > 0) {
      // Récupérer tous les paiements pour tous les étudiants (avec sessions pour le calcul précis)
      const { data: allPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*, sessions')
        .in('student_id', studentIds)
        .order('created_at', { descending: false })
      
      if (paymentsError) {
        logger.error('Error fetching payments for bilan', paymentsError)
        throw paymentsError
      }
      
      // Stocker tous les paiements pour le calcul du total_encaisse_mois
      allPaymentsData = allPayments || []
      
      // Organiser les paiements par étudiant
      const paymentsByStudent = new Map()
      allPayments?.forEach(payment => {
        const studentId = payment.student_id
        if (!paymentsByStudent.has(studentId)) {
          paymentsByStudent.set(studentId, [])
        }
        paymentsByStudent.get(studentId).push(payment)
      })
      
      // Calculer les totaux et trouver le dernier paiement pour chaque étudiant
      paymentsByStudent.forEach((payments, studentId) => {
        const sorted = payments.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )
        lastPaymentsMap.set(studentId, sorted[0] || null)
        
        const total = payments.reduce((sum, p) => sum + (p.montant_total || 0), 0)
        paymentsMap.set(studentId, total)
      })
    }
    
    // Traiter chaque étudiant avec les données préchargées
    // Inclure TOUS les étudiants, pas seulement ceux qui ont payé pour ce mois
    const studentsWithPayments = (students || []).map((student) => {
      const lastPayment = lastPaymentsMap.get(student.id) || null
      const totalPaye = paymentsMap.get(student.id) || 0
      
      // Filtrer les sessions pour exclure les mois hors service
      const allSessions = student.months_ledger || []
      const validSessions = allSessions.filter(session => !pausedMonths.includes(session))
      
      // Calculer le statut pour le mois sélectionné (comme dans BilanMensuel.jsx)
      let statutMoisX = 'EXPIRE'
      
      if (pausedMonths.includes(monthStr)) {
        // Si le mois est hors service, tous les étudiants sont hors service
        statutMoisX = 'HORS_SERVICE'
      } else if (validSessions.includes(monthStr)) {
        // Si le mois est dans les sessions valides, l'étudiant est actif
        statutMoisX = 'ACTIF'
      } else if (validSessions.length > 0) {
        // Vérifier si l'étudiant est en retard ou expiré
        const lastValidMonth = validSessions.sort().pop()
        if (lastValidMonth && lastValidMonth < monthStr) {
          // Calculer si on est dans la période de grâce (5 jours après le dernier mois payé)
          const [year, month] = lastValidMonth.split('-').map(Number)
          const lastPaidDate = new Date(year, month, 1)
          const nextMonthDate = new Date(year, month + 1, 1)
          const graceEndDate = new Date(nextMonthDate)
          graceEndDate.setDate(graceEndDate.getDate() + 5)
          
          const selectedDate = new Date(monthStr + '-01')
          if (selectedDate <= graceEndDate) {
            statutMoisX = 'EN_RETARD'
          } else {
            statutMoisX = 'EXPIRE'
          }
        } else {
          statutMoisX = 'EXPIRE'
        }
      }
      
      // Mois couverts (première session à dernière session) - Format français
      // Utiliser uniquement les sessions valides (hors service exclus)
      let moisCouverts = 'Aucun'
      if (validSessions.length > 0) {
        try {
          const firstMonth = format(parseISO(validSessions[0] + '-01'), 'MMMM yyyy', { locale: fr })
          const lastMonth = format(parseISO(validSessions[validSessions.length - 1] + '-01'), 'MMMM yyyy', { locale: fr })
          moisCouverts = `${firstMonth} à ${lastMonth}`
        } catch {
          // Fallback si erreur de parsing
          moisCouverts = `${validSessions[0]} à ${validSessions[validSessions.length - 1]}`
        }
      }
      
      // Calculer les sessions futures et si le paiement est anticipé
      const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM')
      const futureSessions = validSessions.filter(session => session > currentMonth)
      const isAnticipated = futureSessions.length > 0
      
      return {
        numero_etudiant: student.id.substring(0, 8).toUpperCase(),
        nom_complet: `${student.nom} ${student.prenom || ''}`.trim(),
        classe: student.classe || 'N/A',
        niveau: student.niveau || 'N/A',
        ligne: student.lines?.nom || 'N/A',
        contact: student.contact || 'N/A',
        statut_mois_x: statutMoisX,
        derniere_date_paiement: lastPayment?.created_at 
          ? formatDateFrench(lastPayment.created_at)
          : 'Aucun',
        derniere_date_paiement_iso: lastPayment?.created_at || null, // Pour les calculs
        montant_dernier_paiement: lastPayment?.montant_total || 0,
        mois_couverts: moisCouverts,
        paiement_anticipe: isAnticipated ? 'Oui' : 'Non',
        sessions_futures: futureSessions.length > 0
        ? futureSessions.map(s => {
            try {
              return format(parseISO(s + '-01'), 'MMMM yyyy', { locale: fr })
            } catch {
              return s
            }
          }).join(', ')
        : 'Aucune',
        montant_total_paye: totalPaye,
      }
    })
    
    // Calculer le montant encaissé pour le mois en question
    // Répartir les paiements multi-mois dans leurs mois respectifs
    // IMPORTANT : Exclure les mois hors service du calcul
    let totalEncaisseMois = 0
    
    // Filtrer les sessions pour exclure les mois hors service
    const filterValidSessions = (sessions) => {
      return (sessions || []).filter(session => !pausedMonths.includes(session))
    }
    
    // Utiliser les paiements déjà récupérés (allPaymentsData)
    // Pour chaque paiement, répartir le montant selon les mois payés (uniquement les mois valides)
    allPaymentsData.forEach(payment => {
      const allSessions = payment.sessions || []
      if (allSessions.length === 0 || !payment.montant_total) return
      
      // Filtrer pour ne garder que les mois valides (non hors service)
      const validSessions = filterValidSessions(allSessions)
      
      // Si aucun mois valide, ignorer ce paiement
      if (validSessions.length === 0) return
      
      // Vérifier si ce paiement inclut le mois recherché (dans les mois valides)
      if (validSessions.includes(monthStr)) {
        // Calculer le montant mensuel basé sur les mois VALIDES uniquement
        // Le montant total est réparti uniquement sur les mois où le service est actif
        const montantMensuel = payment.montant_total / validSessions.length
        // Ajouter seulement la part correspondant au mois recherché
        totalEncaisseMois += montantMensuel
      }
    })
    
    // Calculer les totaux
    const totaux = {
      total_etudiants: studentsWithPayments.length,
      etudiants_actifs: studentsWithPayments.filter(s => 
        s.statut_mois_x.includes('ACTIF')
      ).length,
      etudiants_en_retard: studentsWithPayments.filter(s => 
        s.statut_mois_x === 'EN_RETARD'
      ).length,
      etudiants_expires: studentsWithPayments.filter(s => 
        s.statut_mois_x === 'EXPIRÉ'
      ).length,
      total_encaisse_mois: Math.round(totalEncaisseMois), // Arrondir pour éviter les décimales
      total_encaisse_historique: studentsWithPayments.reduce(
        (sum, s) => sum + s.montant_total_paye, 0
      ),
      // Calculer le montant mensuel moyen pour les revenus potentiels
      montant_mensuel_moyen: studentsWithPayments.length > 0
        ? studentsWithPayments.reduce((sum, s) => {
            // Utiliser le dernier paiement ou estimer à partir du total
            if (s.montant_dernier_paiement > 0) {
              return sum + s.montant_dernier_paiement
            }
            // Si pas de paiement, utiliser une moyenne estimée basée sur les paiements existants
            return sum
          }, 0) / studentsWithPayments.length
        : 0,
    }
    
    totaux.taux_recouvrement = totaux.total_etudiants > 0
      ? ((totaux.etudiants_actifs / totaux.total_etudiants) * 100).toFixed(2) + '%'
      : '0%'
    
    return {
      data: studentsWithPayments,
      totaux,
      month: monthStr,
    }
  } catch (error) {
    logger.error('Erreur lors de la génération du bilan', error)
    throw error
  }
}

/**
 * Exporte le bilan en CSV
 */
export const exportBilanToCSV = (bilanData, month) => {
  const headers = [
    'Numéro étudiant',
    'Nom complet',
    'Classe',
    'Niveau',
    'Ligne',
    'Contact',
    'Statut au mois X',
    'Dernière date paiement',
    'Montant dernier paiement',
    'Mois couverts',
    'Paiement anticipé',
    'Sessions futures',
    'Montant total payé',
  ]
  
  const rows = bilanData.data.map(row => [
    row.numero_etudiant,
    row.nom_complet,
    row.classe,
    row.niveau,
    row.ligne,
    row.contact,
    row.statut_mois_x,
    row.derniere_date_paiement,
    row.montant_dernier_paiement,
    row.mois_couverts,
    row.paiement_anticipe,
    row.sessions_futures,
    row.montant_total_paye,
  ])
  
  // Ajouter les totaux
  rows.push([])
  rows.push(['TOTAUX'])
  rows.push(['Total étudiants', bilanData.totaux.total_etudiants])
  rows.push(['Étudiants actifs', bilanData.totaux.etudiants_actifs])
  rows.push(['Étudiants en retard', bilanData.totaux.etudiants_en_retard])
  rows.push(['Étudiants expirés', bilanData.totaux.etudiants_expires])
  rows.push(['Total encaissé ce mois', bilanData.totaux.total_encaisse_mois])
  rows.push(['Total encaissé (historique)', bilanData.totaux.total_encaisse_historique])
  rows.push(['Taux de recouvrement', bilanData.totaux.taux_recouvrement])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  // Formater le mois pour le nom du fichier
  const monthFormatted = formatMonthForFilename(month)
  const dateExport = format(new Date(), 'dd-MM-yyyy')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Bilan_${monthFormatted}_${dateExport}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Exporte le bilan en Excel
 */
export const exportBilanToExcel = (bilanData, month) => {
  const headers = [
    'Numéro étudiant',
    'Nom complet',
    'Classe',
    'Niveau',
    'Ligne',
    'Contact',
    'Statut au mois X',
    'Dernière date paiement',
    'Montant dernier paiement',
    'Mois couverts',
    'Paiement anticipé',
    'Sessions futures',
    'Montant total payé',
  ]
  
  const rows = bilanData.data.map(row => [
    row.numero_etudiant,
    row.nom_complet,
    row.classe,
    row.niveau,
    row.ligne,
    row.contact,
    row.statut_mois_x,
    row.derniere_date_paiement,
    row.montant_dernier_paiement,
    row.mois_couverts,
    row.paiement_anticipe,
    row.sessions_futures,
    row.montant_total_paye,
  ])
  
  // Créer le workbook
  const workbook = XLSX.utils.book_new()
  
  // Feuille de données
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bilan')
  
  // Feuille de totaux
  const totauxData = [
    ['TOTAUX'],
    ['Total étudiants', bilanData.totaux.total_etudiants],
    ['Étudiants actifs', bilanData.totaux.etudiants_actifs],
    ['Étudiants en retard', bilanData.totaux.etudiants_en_retard],
    ['Étudiants expirés', bilanData.totaux.etudiants_expires],
    ['Total encaissé ce mois', bilanData.totaux.total_encaisse_mois],
    ['Total encaissé (historique)', bilanData.totaux.total_encaisse_historique],
    ['Taux de recouvrement', bilanData.totaux.taux_recouvrement],
  ]
  const totauxSheet = XLSX.utils.aoa_to_sheet(totauxData)
  XLSX.utils.book_append_sheet(workbook, totauxSheet, 'Totaux')
  
  // Formater le mois pour le nom du fichier
  const monthFormatted = formatMonthForFilename(month)
  const dateExport = format(new Date(), 'dd-MM-yyyy')
  
  // Télécharger
  XLSX.writeFile(workbook, `Bilan_${monthFormatted}_${dateExport}.xlsx`)
}

