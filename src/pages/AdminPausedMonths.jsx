import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'
import toast from 'react-hot-toast'
import { Calendar, Plus, X, AlertCircle } from 'lucide-react'
import { Button, Card } from '../components/ui'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function AdminPausedMonths() {
  const { isAdmin } = useAuth()
  const [pausedMonths, setPausedMonths] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  // Charger les mois hors service
  useEffect(() => {
    loadPausedMonths()
  }, [])

  const loadPausedMonths = async () => {
    try {
      // Récupérer le premier enregistrement settings (car id est UUID, pas 'global')
      const { data, error } = await supabase
        .from('settings')
        .select('paused_months, id')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // Si aucun enregistrement n'existe, créer un par défaut
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('settings')
            .insert({ paused_months: [] })
            .select()
            .single()
          
          if (insertError) throw insertError
          setPausedMonths([])
          return
        }
        throw error
      }

      setPausedMonths(data?.paused_months || [])
    } catch (error) {
      logger.error('Erreur chargement mois hors service', error)
      toast.error('Erreur lors du chargement')
    }
  }

  // Ajouter un mois hors service
  const addPausedMonth = async () => {
    const monthId = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`

    if (pausedMonths.includes(monthId)) {
      toast.error('Ce mois est déjà hors service')
      return
    }

    setLoading(true)

    try {
      const updated = [...pausedMonths, monthId].sort()

      // Récupérer le premier enregistrement settings
      const { data: existing, error: fetchError } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // Créer un nouvel enregistrement si aucun n'existe
        const { error: insertError } = await supabase
          .from('settings')
          .insert({ paused_months: updated })
          .select()
          .single()
        
        if (insertError) throw insertError
      } else if (existing) {
        // Mettre à jour l'enregistrement existant
        const { error: updateError } = await supabase
          .from('settings')
          .update({ paused_months: updated })
          .eq('id', existing.id)
        
        if (updateError) throw updateError
      } else {
        throw new Error('Impossible de récupérer ou créer les paramètres')
      }

      // Appeler la fonction SQL pour mettre à jour automatiquement les abonnements
      // Cette fonction retire le mois hors service des months_ledger et sessions
      // et recalcule automatiquement les montants des paiements
      const { data: shiftResult, error: shiftError } = await supabase.rpc('shift_subscriptions_for_paused_month', {
        paused_month: monthId
      })

      if (shiftError) {
        logger.warn('Erreur lors du décalage des abonnements (non bloquant)', shiftError)
        // Continuer même si le décalage échoue
      } else if (shiftResult) {
        logger.info('Abonnements décalés avec succès', {
          paused_month: monthId,
          affected_students: shiftResult.affected_students || 0,
          affected_payments: shiftResult.affected_payments || 0
        })
      }

      const affectedStudents = shiftResult?.affected_students || 0
      const affectedPayments = shiftResult?.affected_payments || 0
      
      setPausedMonths(updated)
      
      let successMessage = `${months[selectedMonth - 1]} ${selectedYear} ajouté hors service.`
      if (affectedStudents > 0 || affectedPayments > 0) {
        successMessage += ` ${affectedStudents} étudiant(s) et ${affectedPayments} paiement(s) mis à jour.`
      }
      toast.success(successMessage, { duration: 5000 })

      // Log dans activity_logs
      try {
        const { data: currentUser } = await supabase.auth.getUser()
        if (currentUser?.user?.id) {
          await supabase.from('activity_logs').insert({
            action: 'PAUSED_MONTH_ADD',
            entity_type: 'SETTINGS',
            user_id: currentUser.user.id,
            details: { month: monthId, timestamp: new Date().toISOString() }
          }).catch(err => logger.debug('Erreur log activity', err))
        }
      } catch (logErr) {
        logger.debug('Erreur log activity', logErr)
      }

    } catch (error) {
      logger.error('Erreur ajout mois hors service', error)
      toast.error('Erreur lors de l\'ajout: ' + (error.message || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  // Retirer un mois hors service
  const removePausedMonth = async (monthId) => {
    setLoading(true)

    try {
      const updated = pausedMonths.filter(m => m !== monthId)

      // Récupérer le premier enregistrement settings
      const { data: existing, error: fetchError } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single()

      if (fetchError) throw fetchError

      const { error } = await supabase
        .from('settings')
        .update({ paused_months: updated })
        .eq('id', existing.id)

      if (error) throw error

      setPausedMonths(updated)
      toast.success('Mois retiré de la liste hors service')

      // Log dans activity_logs
      try {
        const { data: currentUser } = await supabase.auth.getUser()
        if (currentUser?.user?.id) {
          await supabase.from('activity_logs').insert({
            action: 'PAUSED_MONTH_REMOVE',
            entity_type: 'SETTINGS',
            user_id: currentUser.user.id,
            details: { month: monthId, timestamp: new Date().toISOString() }
          }).catch(err => logger.debug('Erreur log activity', err))
        }
      } catch (logErr) {
        logger.debug('Erreur log activity', logErr)
      }

    } catch (error) {
      logger.error('Erreur retrait mois hors service', error)
      toast.error('Erreur lors du retrait: ' + (error.message || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  // Protection : Seuls les admins peuvent accéder
  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Accès réservé aux administrateurs</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6" />
        Gestion des Mois Hors Service
      </h1>

      {/* Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">À quoi ça sert ?</p>
            <p>Les mois hors service (vacances, pause) ne sont pas comptabilisés.</p>
            <p>Si un étudiant paie pour un mois hors service, l'abonnement sera automatiquement décalé au mois suivant.</p>
          </div>
        </div>
      </Card>

      {/* Ajouter un mois */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Ajouter un mois hors service</h2>
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Année</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {[2024, 2025, 2026, 2027, 2028].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Mois</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {months.map((month, i) => (
                <option key={i} value={i + 1}>{month}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={addPausedMonth}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      </Card>

      {/* Liste des mois hors service */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Mois actuellement hors service ({pausedMonths.length})
        </h2>

        {pausedMonths.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun mois hors service configuré
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pausedMonths.map(monthId => {
              const [year, month] = monthId.split('-')
              const monthName = months[Number(month) - 1]
              
              return (
                <div
                  key={monthId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">
                    {monthName} {year}
                  </span>
                  <button
                    onClick={() => removePausedMonth(monthId)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>
      </div>
    </Layout>
  )
}

