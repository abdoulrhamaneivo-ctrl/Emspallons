import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'
import { Button, Input, Select } from '../ui'
import { formatCurrency, formatDate } from '../../lib/utils'
import { PRIX_MENSUEL } from '../../lib/constants'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { format, addMonths, startOfMonth, eachMonthOfInterval } from 'date-fns'

export default function PaymentModal({ student, onClose, onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre_mois: 1,
    date_debut: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  })

  const [calculated, setCalculated] = useState({
    montant_total: PRIX_MENSUEL,
    date_fin: '',
    sessions: [],
  })

  // Calculer les valeurs dérivées
  useEffect(() => {
    if (!formData.date_debut || !formData.nombre_mois) return

    const dateDebut = new Date(formData.date_debut)
    const dateFin = addMonths(dateDebut, formData.nombre_mois)
    const dateFinAdjusted = new Date(dateFin.getTime() - 1) // Dernier jour du mois précédent

    // Générer les sessions (format YYYY-MM)
    const sessions = eachMonthOfInterval({
      start: startOfMonth(dateDebut),
      end: startOfMonth(dateFinAdjusted),
    }).map((date) => format(date, 'yyyy-MM'))

    setCalculated({
      montant_total: formData.nombre_mois * PRIX_MENSUEL,
      date_fin: format(dateFinAdjusted, 'yyyy-MM-dd'),
      sessions,
    })
  }, [formData.date_debut, formData.nombre_mois])

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
            montant_mensuel: PRIX_MENSUEL,
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

      toast.success('Paiement enregistré avec succès')
      onSuccess?.()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement du paiement')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const moisOptions = [1, 2, 3, 5, 6, 12]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* En-tête */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-emsp-green">
              Enregistrer un paiement
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.nom} {student.prenom || ''} - {student.classe}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            <label className="label">Nombre de mois *</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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

          {/* Date de début */}
          <Input
            label="Date de début *"
            type="date"
            value={formData.date_debut}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date_debut: e.target.value }))
            }
            required
          />

          {/* Résumé calculé */}
          <div className="bg-emsp-green-light/10 border-2 border-emsp-green-light rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-emsp-green">Résumé du paiement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Montant mensuel</p>
                <p className="text-lg font-bold text-emsp-green">
                  {formatCurrency(PRIX_MENSUEL)}
                </p>
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
                <p className="text-sm text-gray-600 mb-1">Périodes:</p>
                <div className="flex flex-wrap gap-2">
                  {calculated.sessions.map((session) => (
                    <span
                      key={session}
                      className="px-2 py-1 bg-emsp-yellow text-emsp-green rounded text-xs font-medium"
                    >
                      {session}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

