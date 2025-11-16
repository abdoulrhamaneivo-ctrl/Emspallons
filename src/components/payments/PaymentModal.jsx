import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'
import { Button, Input } from '../ui'
import { formatCurrency, formatDate, formatMonthFrench, formatMonthsListFrench } from '../../lib/utils'
import { PRIX_MENSUEL } from '../../lib/constants'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { format, addMonths, startOfMonth, isAfter, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateReceiptPDF, downloadReceipt } from '../../services/receiptService'
import { Info } from 'lucide-react'
import { calculatePrice } from '../../utils/priceCalculator'
import InfoTooltip from '../ui/InfoTooltip'
import logger from '../../lib/logger'
import { sendPaymentConfirmationWhatsApp } from '../../services/whatsappAutoService'

const WHATSAPP_ENABLED = Boolean(import.meta.env.VITE_WHATSAPP_API_KEY)

export default function PaymentModal({ student, onClose, onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [priceInfo, setPriceInfo] = useState({ price: PRIX_MENSUEL, source: 'default' })
  // Calculer automatiquement la date de début
  const calculateDefaultStartDate = () => {
    // Récupérer le dernier mois payé de l'étudiant
    const lastMonth = student.months_ledger?.[student.months_ledger.length - 1]
    
    if (lastMonth) {
      // Partir du mois suivant le dernier payé
      const [year, month] = lastMonth.split('-').map(Number)
      const nextMonth = new Date(year, month, 1) // Mois suivant
      return format(nextMonth, 'yyyy-MM-dd')
    }
    
    // Sinon, 1er du mois actuel
    const now = new Date()
    return format(startOfMonth(now), 'yyyy-MM-dd')
  }

  const [formData, setFormData] = useState({
    nombre_mois: 1,
    date_debut: calculateDefaultStartDate(),
    paiement_anticipe: false,
  })

  const [calculated, setCalculated] = useState({
    montant_total: PRIX_MENSUEL,
    date_fin: '',
    sessions: [],
  })
  const [pausedMonths, setPausedMonths] = useState([])

  // Charger les mois hors service et le prix dynamique au chargement
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger le prix
        const price = await calculatePrice({
          niveau: student.niveau || null,
          ligne_id: student.ligne_id || null,
        })
        setPriceInfo(price)

        // Charger les mois hors service
        const { data: settings } = await supabase
          .from('settings')
          .select('paused_months')
          .limit(1)
          .single()

        setPausedMonths(settings?.paused_months || [])
      } catch (error) {
        logger.error('Erreur chargement données PaymentModal', error, { studentId: student?.id })
      }
    }
    fetchData()
  }, [student])

  // Calculer les valeurs dérivées avec gestion des mois hors service
  useEffect(() => {
    if (!formData.date_debut || !formData.nombre_mois) return

    try {
      const dateDebut = new Date(formData.date_debut)
      // Vérifier que la date est valide
      if (isNaN(dateDebut.getTime())) {
        logger.error('Date de début invalide dans PaymentModal', null, { date_debut: formData.date_debut })
        // Utiliser le mois actuel par défaut
        const defaultDate = format(startOfMonth(new Date()), 'yyyy-MM-dd')
        setFormData(prev => ({ ...prev, date_debut: defaultDate }))
        return
      }

      // Générer les sessions en excluant les mois hors service
      const sessions = []
      let currentDate = new Date(dateDebut)
      let monthsAdded = 0
      let attempts = 0
      const maxAttempts = formData.nombre_mois * 2 // Protection contre boucle infinie

      while (monthsAdded < formData.nombre_mois && attempts < maxAttempts) {
        const sessionId = format(currentDate, 'yyyy-MM')
        
        // Vérifier si ce mois est hors service
        if (!pausedMonths.includes(sessionId)) {
          sessions.push(sessionId)
          monthsAdded++
        } else {
          logger.info(`Mois ${sessionId} hors service, décalage au mois suivant`)
        }
        
        // Passer au mois suivant
        currentDate = addMonths(currentDate, 1)
        attempts++
      }

      if (attempts >= maxAttempts) {
        logger.warn('Trop de tentatives pour générer les sessions', {
          nombre_mois: formData.nombre_mois,
          sessions_generes: sessions.length
        })
      }

      // Calculer la date de fin (dernier jour du dernier mois)
      const lastSession = sessions[sessions.length - 1]
      if (lastSession) {
        const [year, month] = lastSession.split('-').map(Number)
        const lastDay = new Date(year, month, 0) // Dernier jour du mois
        const dateFinAdjusted = lastDay

        // Vérifier si c'est un paiement anticipé (mois de début dans le futur)
        const currentMonth = startOfMonth(new Date())
        const debutMonth = startOfMonth(dateDebut)
        const isAnticipated = isAfter(debutMonth, currentMonth) || formData.paiement_anticipe

        setCalculated({
          montant_total: formData.nombre_mois * priceInfo.price, // Montant basé sur nombre_mois demandé
          date_fin: format(dateFinAdjusted, 'yyyy-MM-dd'),
          sessions,
          isAnticipated,
          futureSessions: sessions.filter(s => {
            try {
              const sessionDate = parseISO(s + '-01')
              return isAfter(sessionDate, currentMonth)
            } catch {
              return false
            }
          }),
          pausedMonthsExcluded: pausedMonths.filter(pm => {
            const [year, month] = pm.split('-').map(Number)
            const pausedDate = new Date(year, month - 1, 1)
            const startDate = startOfMonth(dateDebut)
            const endDate = new Date(year, month, 0)
            return pausedDate >= startDate && pausedDate <= endDate
          })
        })
      }
    } catch (error) {
      logger.error('Erreur lors du calcul des valeurs dérivées dans PaymentModal', error, {
        date_debut: formData.date_debut,
        nombre_mois: formData.nombre_mois
      })
    }
  }, [formData.date_debut, formData.nombre_mois, formData.paiement_anticipe, priceInfo.price, pausedMonths])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Créer le paiement
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            student_id: student.id,
            montant_total: calculated.montant_total,
            nombre_mois: formData.nombre_mois,
            montant_mensuel: priceInfo.price,
            date_debut: formData.date_debut,
            date_fin: calculated.date_fin,
            sessions: calculated.sessions,
            created_by: user?.id || null,
          },
        ])
        .select()
        .single()

      if (paymentError) throw paymentError

      // Le trigger update_months_ledger_on_payment mettra à jour automatiquement
      // le months_ledger de l'étudiant et le statut_paiement

      if (WHATSAPP_ENABLED) {
        sendPaymentConfirmationWhatsApp(student.id, payment.id).catch(err => {
          logger.error('Erreur envoi WhatsApp (non bloquant)', err)
        })
      }

      // Générer et télécharger le reçu PDF
      try {
        // Récupérer les données complètes de l'étudiant avec la ligne
        const { data: studentData } = await supabase
          .from('students')
          .select(`
            *,
            lines:ligne_id (
              id,
              nom,
              couleur
            )
          `)
          .eq('id', student.id)
          .single()

        const updatedStudent = studentData || student

        // Générer et télécharger le reçu PDF
        try {
          const doc = await generateReceiptPDF(payment, updatedStudent)
          const studentName = `${student.nom} ${student.prenom || ''}`.trim()
          downloadReceipt(doc, studentName, payment.created_at || new Date().toISOString())
          toast.success('Reçu généré et téléchargé')
        } catch (receiptError) {
          logger.error('Erreur lors de la génération du reçu', receiptError, { paymentId: payment?.id })
          toast.error('Paiement enregistré mais erreur lors de la génération du reçu')
        }

        // Télécharger automatiquement le QR code
        try {
          const { downloadQRCodeFromToken } = await import('../../utils/qrDownload')
          // Petit délai pour laisser le reçu se télécharger d'abord
          setTimeout(() => {
            downloadQRCodeFromToken(updatedStudent)
              .then(() => {
                toast.success('QR Code téléchargé automatiquement')
              })
              .catch((qrError) => {
                logger.error('Erreur lors du téléchargement du QR code', qrError, { studentId: student?.id })
                toast.error('QR Code non téléchargé automatiquement')
              })
          }, 1000)
        } catch (qrError) {
          logger.error('Erreur lors du téléchargement automatique du QR code', qrError, { studentId: student?.id })
          // Ne pas bloquer le paiement si le QR code ne se télécharge pas
        }

      } catch (error) {
        logger.error('Erreur lors de la récupération des données étudiant', error, { studentId: student?.id })
        toast.error('Paiement enregistré mais erreur lors de la récupération des données')
      }

      toast.success('Paiement enregistré avec succès')
      onSuccess?.()
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement du paiement', error, { studentId: student?.id })
      toast.error(error.message || 'Erreur lors de l\'enregistrement du paiement')
    } finally {
      setLoading(false)
    }
  }

  const moisOptions = [1, 2, 3, 5, 6, 12]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-auto max-h-[95vh] flex flex-col">
        {/* En-tête */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-xl sm:text-2xl font-bold text-emsp-green truncate">
              Enregistrer un paiement
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
              {student.nom} {student.prenom || ''} - {student.classe}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Informations étudiant */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Contact:</span>
              <span className="text-sm font-medium">{student.contact}</span>
            </div>
            {student.point_ramassage && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Point de ramassage:</span>
                <span className="text-sm font-medium">{student.point_ramassage}</span>
              </div>
            )}
            {student.statut_paiement && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Statut actuel:</span>
                <span className={`text-sm font-medium ${
                  student.statut_paiement === 'ACTIF' ? 'text-green-600' :
                  student.statut_paiement === 'EN_RETARD' ? 'text-yellow-600' :
                  student.statut_paiement === 'EXPIRE' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {student.statut_paiement}
                </span>
              </div>
            )}
          </div>

          {/* Nombre de mois */}
          <div>
            <label className="label text-sm sm:text-base">Nombre de mois *</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {moisOptions.map((mois) => (
                <button
                  key={mois}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, nombre_mois: mois }))}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.nombre_mois === mois
                      ? 'border-emsp-yellow bg-emsp-yellow text-emsp-green font-semibold'
                      : 'border-gray-300 hover:border-emsp-green'
                  }`}
                >
                  {mois}
                </button>
              ))}
            </div>
          </div>

          {/* Mois de début */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Date de début
              <span className="text-gray-500 text-xs ml-2">(Calculée automatiquement)</span>
            </label>
            <Input
              label=""
              type="month"
              value={(() => {
                try {
                  // formData.date_debut est au format 'yyyy-MM-dd', on extrait juste 'yyyy-MM'
                  const date = new Date(formData.date_debut)
                  if (isNaN(date.getTime())) {
                    // Si la date est invalide, utiliser le mois actuel
                    return format(startOfMonth(new Date()), 'yyyy-MM')
                  }
                  return format(date, 'yyyy-MM')
                } catch {
                  return format(startOfMonth(new Date()), 'yyyy-MM')
                }
              })()}
              onChange={(e) => {
                const monthValue = e.target.value
                if (monthValue) {
                  const firstDay = monthValue + '-01'
                  setFormData((prev) => ({ ...prev, date_debut: firstDay }))
                }
              }}
              required
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              {student.months_ledger?.length > 0 
                ? '📅 Continuation après le dernier mois payé'
                : '📅 Premier paiement - 1er du mois actuel'
              }
            </p>
          </div>

          {/* Checkbox Paiement anticipé */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.paiement_anticipe}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, paiement_anticipe: e.target.checked }))
                }
                className="mt-1 w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-emsp-green">Paiement anticipé</span>
                  <InfoTooltip content="Permet de payer pour des mois futurs. L'étudiant sera marqué ACTIF immédiatement même si le mois n'est pas encore arrivé. Utile pour les paiements en avance." />
                </div>
                {formData.paiement_anticipe && (
                  <p className="text-sm text-gray-700 mt-1">
                    Ce paiement couvrira les mois futurs. L&apos;étudiant sera marqué comme ACTIF dès maintenant.
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Exemple visuel si paiement anticipé */}
          {calculated.isAnticipated && calculated.futureSessions.length > 0 && (
            <div className="bg-emsp-yellow/20 border-2 border-emsp-yellow rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="text-emsp-yellow mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="font-semibold text-emsp-green mb-2">
                    Paiement de {formData.nombre_mois} mois à partir de {format(parseISO(formData.date_debut), 'MMMM yyyy', { locale: fr })}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">→ Couvrira :</span>{' '}
                      {formatMonthsListFrench(calculated.sessions)}
                    </p>
                    <p className="text-green-700 font-semibold">
                      → Statut : ACTIF dès maintenant
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Résumé calculé */}
          <div className="bg-emsp-green-light/10 border-2 border-emsp-green-light rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-emsp-green">Résumé du paiement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Montant mensuel</p>
                <p className="text-lg font-bold text-emsp-green">
                  {formatCurrency(priceInfo.price)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Source : {
                    priceInfo.source === 'niveau' ? 'Par niveau' :
                    priceInfo.source === 'line' ? 'Par ligne' :
                    'Par défaut'
                  }
                </p>
                {priceInfo.source !== 'default' && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                    Prix personnalisé
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="text-lg font-bold text-emsp-green">
                  {formatCurrency(calculated.montant_total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de fin</p>
                <p className="text-lg font-semibold">
                  {calculated.date_fin ? formatDate(calculated.date_fin) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sessions couvertes</p>
                <p className="text-lg font-semibold">
                  {calculated.sessions.length} mois
                </p>
              </div>
            </div>
            {calculated.sessions.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Périodes couvertes:</p>
                <div className="flex flex-wrap gap-2">
                  {calculated.sessions.map((session) => (
                    <span
                      key={session}
                      className="px-2 py-1 bg-emsp-yellow text-emsp-green rounded text-xs font-medium"
                    >
                      {formatMonthFrench(session)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {calculated.pausedMonthsExcluded && calculated.pausedMonthsExcluded.length > 0 && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                <p className="text-xs text-orange-700">
                  ⚠️ {calculated.pausedMonthsExcluded.length} mois hors service exclu(s) : {formatMonthsListFrench(calculated.pausedMonthsExcluded)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  L&apos;abonnement a été automatiquement décalé pour couvrir {formData.nombre_mois} mois actifs.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Enregistrement...' : (
                <>
                  <span className="hidden sm:inline">Enregistrer le paiement</span>
                  <span className="sm:hidden">Enregistrer</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

