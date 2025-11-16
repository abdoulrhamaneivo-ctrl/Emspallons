import { useState, useEffect, useCallback, useMemo } from 'react'
import Layout from '../components/Layout'
import PageTransition from '../components/ui/PageTransition'
import { Card, Button, AnimatedCounter } from '../components/ui'
import { FileText, Download, Printer, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { PRIX_MENSUEL } from '../lib/constants'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const formatMonthLabel = (value) => {
  if (!value) return ''
  const [year, month] = value.split('-').map(Number)
  return format(new Date(year, (month || 1) - 1, 1), 'MMMM yyyy', { locale: fr })
}

const compareMonths = (a, b) => {
  if (!a || !b) return 0
  return a.localeCompare(b)
}

// Fonction pour générer une référence basée sur l'ID du paiement
const generateReference = (paymentId, createdAt) => {
  const date = new Date(createdAt)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const shortId = paymentId.substring(0, 8).toUpperCase().replace(/-/g, '')
  return `RCP-${year}-${month}-${shortId}`
}

const categorizePayment = (payment, selectedMonth) => {
  const sessions = (payment.sessions || []).filter(Boolean)
  if (sessions.length === 0) return 'normaux'

  const hasFuture = sessions.some((session) => compareMonths(session, selectedMonth) > 0)
  if (hasFuture) return 'anticipes'

  const isAllPast = sessions.every((session) => compareMonths(session, selectedMonth) < 0)
  if (isAllPast) return 'retard'

  return 'normaux'
}

const buildStats = (payments, students, selectedMonth) => {
  const totalEncaisse = payments.reduce((sum, payment) => sum + (payment.montant_total || 0), 0)
  const nombrePaiements = payments.length
  const montantMoyen = nombrePaiements ? totalEncaisse / nombrePaiements : 0

  const categories = {
    normaux: 0,
    anticipes: 0,
    retard: 0,
  }

  payments.forEach((payment) => {
    const type = categorizePayment(payment, selectedMonth)
    categories[type] += 1
  })

  // Statistiques par statut (ACTIF, EN_RETARD, EXPIRE, HORS_SERVICE)
  const parStatut = {
    ACTIF: 0,
    EN_RETARD: 0,
    EXPIRE: 0,
    HORS_SERVICE: 0,
  }
  
  students.forEach((student) => {
    const statut = student.statutPourMois || student.statut_paiement || 'EXPIRE'
    if (parStatut.hasOwnProperty(statut)) {
      parStatut[statut] = (parStatut[statut] || 0) + 1
    }
  })

  // Statistiques par ligne (abonnés) - TOUS les étudiants
  const parLigne = {}
  students.forEach((student) => {
    const line = student.lines?.nom || 'Sans ligne'
    parLigne[line] = (parLigne[line] || 0) + 1
  })

  // Statistiques par ligne (paiements)
  const paiementsParLigne = {}
  const montantsParLigne = {}
  payments.forEach((payment) => {
    const line = payment.student?.lines?.nom || 'Sans ligne'
    paiementsParLigne[line] = (paiementsParLigne[line] || 0) + 1
    montantsParLigne[line] = (montantsParLigne[line] || 0) + (payment.montant_total || 0)
  })

  // Classement des lignes par nombre d'abonnés
  const classementAbonnes = Object.entries(parLigne)
    .map(([nom, count]) => ({
      nom,
      abonnes: count,
      montantTotal: montantsParLigne[nom] || 0,
      nombrePaiements: paiementsParLigne[nom] || 0,
      montantMoyen: paiementsParLigne[nom] > 0 ? (montantsParLigne[nom] || 0) / paiementsParLigne[nom] : 0,
      revenuTheorique: count * PRIX_MENSUEL,
      tauxRecouvrement: count * PRIX_MENSUEL > 0 
        ? (((montantsParLigne[nom] || 0) / (count * PRIX_MENSUEL)) * 100).toFixed(1) 
        : '0',
    }))
    .sort((a, b) => b.abonnes - a.abonnes)

  // Classement des lignes par montant total payé
  const classementMontant = [...classementAbonnes].sort((a, b) => b.montantTotal - a.montantTotal)

  // Total étudiants (TOUS les étudiants, pas seulement ceux qui ont payé)
  const totalEtudiants = students.length
  
  // Étudiants actifs = ceux qui ont le statut ACTIF pour le mois sélectionné
  const etudiantsActifs = parStatut.ACTIF || 0
  
  const revenuTheorique = totalEtudiants * PRIX_MENSUEL
  const tauxRecouvrement =
    revenuTheorique > 0 ? ((totalEncaisse / revenuTheorique) * 100).toFixed(1) : '0'

  return {
    totalEncaisse,
    nombrePaiements,
    montantMoyen,
    paiementsNormaux: categories.normaux,
    paiementsAnticipes: categories.anticipes,
    paiementsRetard: categories.retard,
    totalEtudiants, // Total de tous les étudiants
    etudiantsActifs, // Seulement ceux avec statut ACTIF pour ce mois
    parStatut, // Répartition par statut
    revenuTheorique,
    tauxRecouvrement,
    parLigne,
    paiementsParLigne,
    montantsParLigne,
    classementAbonnes,
    classementMontant,
  }
}

export default function BilanMensuel() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [selectedLigne, setSelectedLigne] = useState('all') // 'all' pour toutes les lignes
  const [loading, setLoading] = useState(false)
  const [bilanData, setBilanData] = useState(null)
  const [lignes, setLignes] = useState([])

  // Charger les lignes disponibles
  useEffect(() => {
    const loadLignes = async () => {
      try {
        const { data, error } = await supabase
          .from('lines')
          .select('id, nom, couleur')
          .order('nom', { ascending: true })
        
        if (error) throw error
        setLignes(data || [])
      } catch (error) {
        logger.error('Erreur chargement lignes', error)
      }
    }
    loadLignes()
  }, [])

  const loadBilan = useCallback(async () => {
    setLoading(true)
    try {
      if (!selectedMonth) {
        setBilanData(null)
        return
      }
      
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
      }
      
      // Vérifier si le mois sélectionné est un mois hors service
      if (pausedMonths.includes(selectedMonth)) {
        logger.info('Mois sélectionné est hors service', { month: selectedMonth })
        toast.info('Ce mois est marqué comme hors service (vacances). Aucun bilan disponible.')
        setBilanData({
          payments: [],
          students: [],
          stats: buildStats([], [], selectedMonth),
          allPayments: [],
          allStudents: [],
          pausedMonth: true
        })
        return
      }
      
      const [year, month] = selectedMonth.split('-').map(Number)
      const startDate = `${selectedMonth}-01T00:00:00`
      const endDate = new Date(year, month, 0)
      const endDateISO = `${format(endDate, 'yyyy-MM-dd')}T23:59:59`

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          created_at,
          montant_total,
          nombre_mois,
          sessions,
          date_debut,
          date_fin,
          student:student_id (
            id,
            nom,
            prenom,
            contact,
            classe,
            niveau,
            ligne_id,
            lines:ligne_id (
              nom
            )
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDateISO)
        .order('created_at', { ascending: true })

      if (paymentsError) throw paymentsError

      // Filtrer les paiements pour exclure ceux qui concernent uniquement des mois hors service
      // Un paiement est valide pour ce mois si :
      // 1. Il a des sessions qui incluent le mois sélectionné
      // 2. ET le mois sélectionné n'est pas dans pausedMonths (déjà vérifié)
      // 3. ET au moins une session du paiement est valide (pas dans pausedMonths)
      const validPayments = (payments || []).filter(payment => {
        const paymentSessions = payment.sessions || []
        if (paymentSessions.length === 0) return false
        
        // Filtrer les sessions pour exclure les mois hors service
        const validSessions = paymentSessions.filter(session => !pausedMonths.includes(session))
        
        // Le paiement est valide si :
        // - Il a au moins une session valide
        // - ET le mois sélectionné est dans les sessions valides (pas dans pausedMonths car déjà vérifié)
        return validSessions.length > 0 && validSessions.includes(selectedMonth)
      })

      const studentSelect = `
          id,
          nom,
          prenom,
          contact,
          classe,
          niveau,
          ligne_id,
          months_ledger,
          statut_paiement,
          lines:ligne_id (
            nom,
            couleur
          )
        `

      // CHANGEMENT IMPORTANT : Charger TOUS les étudiants, pas seulement ceux qui ont payé pour ce mois
      // Le bilan mensuel doit afficher tous les étudiants avec leur statut pour le mois sélectionné
      let students = []
      const { data: allStudentsData, error: studentsError } = await supabase
        .from('students')
        .select(studentSelect)

      if (studentsError) throw studentsError
      students = allStudentsData || []

      // Pour chaque étudiant, calculer son statut pour le mois sélectionné
      // Un étudiant apparaît dans le bilan s'il :
      // 1. A au moins une session valide dans son months_ledger (après exclusion des mois hors service)
      // 2. OU n'a aucune session (étudiant sans paiement) - pour voir tous les étudiants
      const validStudents = (students || []).map(student => {
        const studentSessions = student.months_ledger || []
        
        // Filtrer les sessions pour exclure les mois hors service
        const validSessions = studentSessions.filter(session => !pausedMonths.includes(session))
        
        // Calculer le statut pour le mois sélectionné
        let statutPourMois = 'EXPIRE'
        
        if (pausedMonths.includes(selectedMonth)) {
          // Si le mois est hors service, tous les étudiants sont hors service
          statutPourMois = 'HORS_SERVICE'
        } else if (validSessions.includes(selectedMonth)) {
          // Si le mois est dans les sessions valides, l'étudiant est actif
          statutPourMois = 'ACTIF'
        } else if (validSessions.length > 0) {
          // Vérifier si l'étudiant est en retard ou expiré
          const lastValidMonth = validSessions.sort().pop()
          if (lastValidMonth && lastValidMonth < selectedMonth) {
            // Calculer si on est dans la période de grâce (5 jours après le dernier mois payé)
            const [year, month] = lastValidMonth.split('-').map(Number)
            const lastPaidDate = new Date(year, month, 1) // Premier jour du mois payé
            const nextMonthDate = new Date(year, month + 1, 1) // Premier jour du mois suivant
            const graceEndDate = new Date(nextMonthDate)
            graceEndDate.setDate(graceEndDate.getDate() + 5) // 5 jours de grâce
            
            const selectedDate = new Date(selectedMonth + '-01')
            if (selectedDate <= graceEndDate) {
              statutPourMois = 'EN_RETARD'
            } else {
              statutPourMois = 'EXPIRE'
            }
          } else {
            statutPourMois = 'EXPIRE'
          }
        }
        
        return {
          ...student,
          statutPourMois, // Statut calculé pour le mois sélectionné
          validSessions // Sessions valides (hors service exclus)
        }
      }).filter(student => {
        // Inclure TOUS les étudiants dans le bilan, même ceux sans paiement
        // On filtre seulement si on veut exclure certains cas spéciaux
        return true
      })

      // Filtrer par ligne si une ligne est sélectionnée
      let filteredPayments = validPayments
      let filteredStudents = validStudents

      if (selectedLigne !== 'all') {
        // Trouver l'ID de la ligne sélectionnée
        const ligne = lignes.find(l => l.id === selectedLigne || l.nom === selectedLigne)
        if (ligne) {
          filteredPayments = validPayments.filter(p => p.student?.ligne_id === ligne.id)
          filteredStudents = validStudents.filter(s => s.ligne_id === ligne.id)
        }
      }

      const stats = buildStats(filteredPayments, filteredStudents, selectedMonth)
      setBilanData({
        payments: filteredPayments,
        students: filteredStudents,
        stats,
        allPayments: validPayments,
        allStudents: validStudents,
        pausedMonth: false
      })
    } catch (error) {
      logger.error('Erreur chargement bilan mensuel', error, { selectedMonth })
      toast.error('Impossible de charger le bilan mensuel')
      setBilanData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedLigne, lignes])

  useEffect(() => {
    loadBilan()
  }, [loadBilan])

  const moisLisible = useMemo(() => formatMonthLabel(selectedMonth), [selectedMonth])

  const exportBilanExcel = async () => {
    if (!bilanData) return

    try {
      const wb = XLSX.utils.book_new()
      const resumeData = [
        ['BILAN MENSUEL - EMSP TRANSPORT CAR SCOLAIRE'],
        [],
        ['Mois', moisLisible],
        ['Date d’édition', format(new Date(), 'dd/MM/yyyy', { locale: fr })],
        [],
        ['Finances'],
        ['Total encaissé', bilanData.stats.totalEncaisse],
        ['Nombre de paiements', bilanData.stats.nombrePaiements],
        ['Montant moyen', Math.round(bilanData.stats.montantMoyen)],
        [],
        ['Étudiants'],
        ['Total étudiants', bilanData.stats.totalEtudiants || 0],
        ['Étudiants actifs', bilanData.stats.etudiantsActifs],
        ['Revenu théorique', bilanData.stats.revenuTheorique],
        ['Taux de recouvrement', `${bilanData.stats.tauxRecouvrement}% (${bilanData.stats.totalEncaisse.toLocaleString('fr-FR')} / ${bilanData.stats.revenuTheorique.toLocaleString('fr-FR')} FCFA)`],
      ]

      const ws1 = XLSX.utils.aoa_to_sheet(resumeData)
      XLSX.utils.book_append_sheet(wb, ws1, 'Résumé')

      // Récupérer les mois hors service pour l'export
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
        logger.debug('Erreur récupération paused_months pour export', error)
      }
      
      // Fonction pour filtrer les sessions valides (hors service exclus)
      const filterValidSessions = (sessions) => {
        return (sessions || []).filter(session => !pausedMonths.includes(session))
      }

      const paymentsData = bilanData.payments.map((payment) => {
        const allSessions = payment.sessions || []
        // Filtrer pour ne garder que les mois valides (hors service exclus)
        const validSessions = filterValidSessions(allSessions)
        const currentMonth = selectedMonth
        let moisCouverts = '-'
        
        // Si le paiement couvre plusieurs mois, montrer le format "1/5" basé sur les mois valides
        if (validSessions.length > 1) {
          const monthIndex = validSessions.indexOf(currentMonth)
          if (monthIndex !== -1) {
            // Format "1/5" pour ce mois dans le bilan (basé sur les mois valides uniquement)
            moisCouverts = `${monthIndex + 1}/${validSessions.length} (${validSessions.join(', ')})`
          } else {
            // Ce mois n'est pas dans ce paiement
            moisCouverts = `0/${validSessions.length} (${validSessions.join(', ')})`
          }
        } else if (validSessions.length === 1) {
          moisCouverts = validSessions[0]
        }
        
        return {
          Date: format(new Date(payment.created_at), 'dd/MM/yyyy'),
          Référence: generateReference(payment.id, payment.created_at),
          Étudiant: `${payment.student?.nom || ''} ${payment.student?.prenom || ''}`.trim(),
          'Ligne de car': payment.student?.lines?.nom || '-',
          'Mois couverts (hors service exclus)': moisCouverts,
          'Position dans paiement': validSessions.length > 1 && validSessions.indexOf(currentMonth) !== -1 
            ? `${validSessions.indexOf(currentMonth) + 1}/${validSessions.length}`
            : validSessions.length > 1 ? `0/${validSessions.length}` : '1/1',
          'Nombre total de mois (valides)': validSessions.length || 0,
          'Montant total (FCFA)': payment.montant_total || 0,
          'Montant ce mois (FCFA)': validSessions.length > 0 && validSessions.includes(currentMonth)
            ? Math.round((payment.montant_total || 0) / validSessions.length)
            : 0,
        }
      })

      const ws2 = XLSX.utils.json_to_sheet(paymentsData)
      XLSX.utils.book_append_sheet(wb, ws2, 'Paiements')

      const studentsData = bilanData.students.map((student) => ({
        Nom: student.nom,
        Prénom: student.prenom || '',
        Classe: student.classe || '-',
        Niveau: student.niveau || '-',
        'Ligne de car': student.lines?.nom || '-',
        'Mois payés': student.months_ledger?.length || 0,
        'Dernier mois': student.months_ledger?.[student.months_ledger.length - 1] || '-',
        Statut: student.statut_paiement || '-',
      }))
      const ws3 = XLSX.utils.json_to_sheet(studentsData)
      XLSX.utils.book_append_sheet(wb, ws3, 'Étudiants actifs')

      // Feuille 4 : Analyse par ligne de car (uniquement si toutes les lignes)
      if (selectedLigne === 'all' && bilanData.stats.classementAbonnes.length > 0) {
        const lignesData = bilanData.stats.classementAbonnes.map((ligne, index) => ({
          Rang: index + 1,
          'Ligne de car': ligne.nom,
          'Nombre d\'abonnés': ligne.abonnes,
          'Montant total payé (FCFA)': ligne.montantTotal,
          'Nombre de paiements': ligne.nombrePaiements,
          'Montant moyen (FCFA)': Math.round(ligne.montantMoyen),
          'Revenu théorique (FCFA)': ligne.revenuTheorique,
          'Taux de recouvrement (%)': ligne.tauxRecouvrement,
        }))
        
        const ws4 = XLSX.utils.json_to_sheet(lignesData)
        ws4['!cols'] = [
          { wch: 8 }, { wch: 20 }, { wch: 18 }, { wch: 25 },
          { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 20 }
        ]
        XLSX.utils.book_append_sheet(wb, ws4, 'Analyse par ligne')
      }

      const filename = selectedLigne === 'all' 
        ? `Bilan-${selectedMonth}.xlsx`
        : `Bilan-${selectedMonth}-${lignes.find(l => l.id === selectedLigne)?.nom || 'ligne'}.xlsx`
      
      XLSX.writeFile(wb, filename)
      toast.success('Bilan exporté avec succès')
      logger.info('Bilan mensuel exporté', { month: selectedMonth })
    } catch (error) {
      logger.error('Erreur export bilan mensuel', error)
      toast.error('Erreur lors de l’export Excel')
    }
  }

  const imprimerBilan = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent flex items-center gap-3">
                <FileText className="text-emsp-yellow" size={32} />
                Bilan Mensuel
              </h1>
              <p className="text-gray-600 mt-1">Vue unifiée des paiements et étudiants actifs</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emsp-yellow"
              />
              <select
                value={selectedLigne}
                onChange={(e) => setSelectedLigne(e.target.value)}
                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emsp-yellow"
              >
                <option value="all">Toutes les lignes</option>
                {lignes.map((ligne) => (
                  <option key={ligne.id} value={ligne.id}>
                    {ligne.nom}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={imprimerBilan}>
                <Printer size={18} className="mr-2" />
                Imprimer
              </Button>
              <Button onClick={exportBilanExcel}>
                <Download size={18} className="mr-2" />
                Exporter
              </Button>
            </div>
          </div>

          {loading ? (
            <Card className="p-10 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du bilan...</p>
            </Card>
          ) : !bilanData ? (
            <Card className="p-10 text-center">
              <p className="text-gray-600">Aucune donnée disponible pour ce mois.</p>
            </Card>
          ) : bilanData.pausedMonth ? (
            <Card className="p-10 text-center bg-orange-50 border-2 border-orange-200">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="text-orange-600" size={48} />
                <div>
                  <h2 className="text-2xl font-bold text-orange-800 mb-2">
                    Mois hors service
                  </h2>
                  <p className="text-orange-700 text-lg mb-2">
                    Le mois <span className="font-semibold">{moisLisible}</span> est marqué comme hors service (vacances).
                  </p>
                  <p className="text-orange-600 text-sm">
                    Aucun bilan disponible pour cette période. Les paiements effectués pendant ce mois ont été automatiquement reportés au prochain mois en service.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <div className="hidden print:block text-center space-y-1">
                <p className="text-lg font-semibold">EMSP Transport Car Scolaire</p>
                <p>{`Bilan du ${moisLisible}`}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <Card className="p-5 bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Total encaissé</p>
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-green-700">
                    <AnimatedCounter value={bilanData.stats.totalEncaisse} suffix=" FCFA" />
                  </p>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Taux de recouvrement</p>
                    <TrendingUp className="text-blue-600" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {bilanData.stats.tauxRecouvrement}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {bilanData.stats.totalEncaisse.toLocaleString('fr-FR')} /{' '}
                    {bilanData.stats.revenuTheorique.toLocaleString('fr-FR')} FCFA
                  </p>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-gray-50 to-white border-l-4 border-gray-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Total étudiants</p>
                    <Users className="text-gray-600" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-700">
                    <AnimatedCounter value={bilanData.stats.totalEtudiants || bilanData.stats.etudiantsActifs || 0} />
                  </p>
                  <p className="text-xs text-gray-500">
                    {bilanData.stats.totalEtudiants || 0} étudiant{(bilanData.stats.totalEtudiants || 0) > 1 ? 's' : ''}
                  </p>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Étudiants actifs</p>
                    <Users className="text-purple-600" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-purple-700">
                    <AnimatedCounter value={bilanData.stats.etudiantsActifs} />
                  </p>
                  <p className="text-xs text-gray-500">
                    {bilanData.stats.totalEtudiants > 0 
                      ? `${Math.round((bilanData.stats.etudiantsActifs / bilanData.stats.totalEtudiants) * 100)}%`
                      : '0%'} ({((bilanData.stats.etudiantsActifs || 0) * PRIX_MENSUEL).toLocaleString('fr-FR')} FCFA)
                  </p>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-orange-50 to-white border-l-4 border-orange-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Paiements enregistrés</p>
                    <Calendar className="text-orange-500" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-orange-600">
                    <AnimatedCounter value={bilanData.stats.nombrePaiements} />
                  </p>
                  <p className="text-xs text-gray-500">
                    Moyenne {Math.round(bilanData.stats.montantMoyen).toLocaleString('fr-FR')} FCFA
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Répartition par statut */}
                <Card className="p-5">
                  <p className="text-sm text-gray-500 mb-3 font-medium">Répartition par statut</p>
                  <div className="space-y-3">
                    {bilanData.stats.parStatut && Object.entries(bilanData.stats.parStatut)
                      .filter(([, count]) => count > 0)
                      .map(([statut, count]) => {
                        const percent = bilanData.stats.totalEtudiants > 0
                          ? Math.round((count / bilanData.stats.totalEtudiants) * 100)
                          : 0
                        const montant = count * PRIX_MENSUEL
                        const statutLabels = {
                          ACTIF: 'Actifs',
                          EN_RETARD: 'En retard',
                          EXPIRE: 'Expirés',
                          HORS_SERVICE: 'Hors service'
                        }
                        const statutColors = {
                          ACTIF: 'text-emsp-green',
                          EN_RETARD: 'text-orange-600',
                          EXPIRE: 'text-red-600',
                          HORS_SERVICE: 'text-gray-600'
                        }
                        return (
                          <div key={statut} className="flex items-center justify-between">
                            <span>{statutLabels[statut] || statut}</span>
                            <span className={`font-semibold ${statutColors[statut] || 'text-gray-600'}`}>
                              {count} ({percent}%) - {montant.toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-gray-500 mb-3 font-medium">Répartition par type</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Paiements normaux</span>
                      <span className="font-semibold text-emsp-green">
                        {bilanData.stats.paiementsNormaux}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Paiements anticipés</span>
                      <span className="font-semibold text-orange-600">
                        {bilanData.stats.paiementsAnticipes}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Paiements en retard</span>
                      <span className="font-semibold text-red-600">
                        {bilanData.stats.paiementsRetard}
                      </span>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-gray-500 mb-3 font-medium">Répartition par ligne</p>
                  <div className="space-y-3">
                    {Object.entries(bilanData.stats.parLigne)
                      .sort(([, a], [, b]) => b - a)
                      .map(([line, count]) => {
                        const percent =
                          bilanData.stats.totalEtudiants > 0
                            ? Math.round((count / bilanData.stats.totalEtudiants) * 100)
                            : 0
                        const montant = count * PRIX_MENSUEL
                        return (
                          <div key={line}>
                            <div className="flex justify-between text-sm">
                              <span>{line}</span>
                              <span className="text-gray-600">
                                {count} étudiant{count > 1 ? 's' : ''} ({percent}%) - {montant.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-emsp-yellow h-2 rounded-full"
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    {Object.keys(bilanData.stats.parLigne).length === 0 && (
                      <p className="text-sm text-gray-500">Aucune donnée disponible.</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Analyse détaillée par ligne de car */}
              {selectedLigne === 'all' && bilanData.stats.classementAbonnes.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Classement par nombre d'abonnés */}
                  <Card className="p-5">
                    <h3 className="text-lg font-bold text-emsp-green mb-4 flex items-center gap-2">
                      <Users className="text-emsp-green" size={20} />
                      Classement par nombre d'abonnés
                    </h3>
                    <div className="space-y-3">
                      {bilanData.stats.classementAbonnes.map((ligne, index) => {
                        const ligneColor = lignes.find(l => l.nom === ligne.nom)?.couleur || '#7CB342'
                        return (
                          <div
                            key={ligne.nom}
                            className="border-l-4 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                            style={{ borderLeftColor: ligneColor }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                <span className="font-semibold text-gray-800">{ligne.nom}</span>
                              </div>
                              <span className="text-lg font-bold text-emsp-green">
                                {ligne.abonnes} abonné{ligne.abonnes > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Montant total :</span>{' '}
                                {ligne.montantTotal.toLocaleString('fr-FR')} FCFA
                              </div>
                              <div>
                                <span className="font-medium">Taux recouvrement :</span>{' '}
                                {ligne.tauxRecouvrement}% ({ligne.montantTotal.toLocaleString('fr-FR')} / {ligne.revenuTheorique.toLocaleString('fr-FR')} FCFA)
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* Classement par montant total payé */}
                  <Card className="p-5">
                    <h3 className="text-lg font-bold text-emsp-green mb-4 flex items-center gap-2">
                      <DollarSign className="text-emsp-green" size={20} />
                      Classement par montant total payé
                    </h3>
                    <div className="space-y-3">
                      {bilanData.stats.classementMontant.map((ligne, index) => {
                        const ligneColor = lignes.find(l => l.nom === ligne.nom)?.couleur || '#7CB342'
                        return (
                          <div
                            key={ligne.nom}
                            className="border-l-4 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                            style={{ borderLeftColor: ligneColor }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                <span className="font-semibold text-gray-800">{ligne.nom}</span>
                              </div>
                              <span className="text-lg font-bold text-green-600">
                                {ligne.montantTotal.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Abonnés :</span> {ligne.abonnes}
                              </div>
                              <div>
                                <span className="font-medium">Moyenne :</span>{' '}
                                {Math.round(ligne.montantMoyen).toLocaleString('fr-FR')} FCFA
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {ligne.nombrePaiements} paiement{ligne.nombrePaiements > 1 ? 's' : ''} enregistré
                              {ligne.nombrePaiements > 1 ? 's' : ''}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </div>
              )}

              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-emsp-green">Détail des paiements</h2>
                  <span className="text-sm text-gray-500">
                    {bilanData.payments.length} enregistrements
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Référence</th>
                        <th className="px-3 py-2 text-left">Étudiant</th>
                        <th className="px-3 py-2 text-left">Ligne</th>
                        <th className="px-3 py-2 text-left">Mois couverts</th>
                        <th className="px-3 py-2 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bilanData.payments.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-3 py-4 text-center text-gray-500">
                            Aucun paiement enregistré pour ce mois.
                          </td>
                        </tr>
                      ) : (
                        bilanData.payments.map((payment) => (
                          <tr key={payment.id} className="border-b">
                            <td className="px-3 py-2">
                              {format(new Date(payment.created_at), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {generateReference(payment.id, payment.created_at)}
                            </td>
                            <td className="px-3 py-2">
                              {payment.student
                                ? `${payment.student.nom} ${payment.student.prenom || ''}`
                                : '—'}
                            </td>
                            <td className="px-3 py-2">{payment.student?.lines?.nom || '—'}</td>
                            <td className="px-3 py-2">
                              {(payment.sessions || []).length > 0 ? (() => {
                                const sessions = payment.sessions || []
                                const currentMonth = selectedMonth
                                const sessionsInCurrentMonth = sessions.filter(s => s === currentMonth).length
                                
                                // Si le paiement couvre plusieurs mois, montrer le format "1/5"
                                if (sessions.length > 1) {
                                  const monthIndex = sessions.indexOf(currentMonth)
                                  if (monthIndex !== -1) {
                                    // Format "1/5" pour ce mois dans le bilan
                                    return (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="font-semibold text-emsp-green">
                                          {monthIndex + 1}/{sessions.length}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          ({sessions.join(', ')})
                                        </span>
                                      </span>
                                    )
                                  }
                                }
                                
                                // Sinon, afficher normalement
                                return sessions.join(', ')
                              })() : '—'}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {payment.montant_total ? (() => {
                                const sessions = payment.sessions || []
                                const currentMonth = selectedMonth
                                
                                // Si le paiement couvre plusieurs mois, montrer le montant de ce mois uniquement
                                if (sessions.length > 1 && sessions.includes(currentMonth)) {
                                  const montantMois = Math.round(payment.montant_total / sessions.length)
                                  return (
                                    <span className="inline-flex flex-col items-end">
                                      <span className="text-emsp-green font-semibold">
                                        {montantMois.toLocaleString('fr-FR')} FCFA
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        (sur {payment.montant_total.toLocaleString('fr-FR')} FCFA)
                                      </span>
                                    </span>
                                  )
                                }
                                
                                // Sinon, afficher le montant total
                                return `${payment.montant_total.toLocaleString('fr-FR')} FCFA`
                              })() : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </PageTransition>
    </Layout>
  )
}


