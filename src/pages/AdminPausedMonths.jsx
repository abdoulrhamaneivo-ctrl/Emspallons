import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'
import toast from 'react-hot-toast'
import { Calendar, Plus, X, AlertCircle } from 'lucide-react'
import { Button, Card } from '../components/ui'

export default function AdminPausedMonths() {
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
      const { data, error } = await supabase
        .from('settings')
        .select('paused_months')
        .eq('id', 'global')
        .single()

      if (error && error.code !== 'PGRST116') throw error

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

      // Vérifier si settings existe
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('id', 'global')
        .single()

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ paused_months: updated })
          .eq('id', 'global')
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({ id: 'global', paused_months: updated })
        
        if (error) throw error
      }

      setPausedMonths(updated)
      toast.success(`${months[selectedMonth - 1]} ${selectedYear} ajouté hors service`)

      // Log dans activity_logs
      await supabase.from('activity_logs').insert({
        action_type: 'PAUSED_MONTH_ADD',
        entity_type: 'SETTINGS',
        details: { month: monthId }
      })

    } catch (error) {
      logger.error('Erreur ajout mois hors service', error)
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setLoading(false)
    }
  }

  // Retirer un mois hors service
  const removePausedMonth = async (monthId) => {
    setLoading(true)

    try {
      const updated = pausedMonths.filter(m => m !== monthId)

      const { error } = await supabase
        .from('settings')
        .update({ paused_months: updated })
        .eq('id', 'global')

      if (error) throw error

      setPausedMonths(updated)
      toast.success('Mois retiré de la liste hors service')

      await supabase.from('activity_logs').insert({
        action_type: 'PAUSED_MONTH_REMOVE',
        entity_type: 'SETTINGS',
        details: { month: monthId }
      })

    } catch (error) {
      logger.error('Erreur retrait mois hors service', error)
      toast.error('Erreur lors du retrait')
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}

