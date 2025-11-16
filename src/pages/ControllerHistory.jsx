import { useState, useEffect, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Download, Calendar, Filter } from 'lucide-react'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import PageTransition from '../components/ui/PageTransition'
import { STATUTS_SCAN } from '../lib/constants'
import { formatDateTime } from '../lib/utils'
import toast from 'react-hot-toast'

export default function ControllerHistory() {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [controller, setController] = useState(null)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    statut: 'all',
  })
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    successRate: 0,
  })

  useEffect(() => {
    // Récupérer la session contrôleur
    const stored = sessionStorage.getItem('controller_session')
    if (!stored) {
      // Précharger ScanQR avant navigation
      import('./ScanQR').then(() => {
        startTransition(() => {
          navigate('/scan')
        })
      }).catch(() => {
        startTransition(() => {
          navigate('/scan')
        })
      })
      return
    }

    try {
      const parsed = JSON.parse(stored)
      setController(parsed.controller_session)
    } catch (e) {
      // Précharger ScanQR avant navigation
      import('./ScanQR').then(() => {
        startTransition(() => {
          navigate('/scan')
        })
      }).catch(() => {
        startTransition(() => {
          navigate('/scan')
        })
      })
    }
  }, [navigate])

  useEffect(() => {
    if (!controller) return
    
    let mounted = true
    
    fetchScans()
    
    // Abonnement temps réel pour synchronisation
    const subscription = supabase
      .channel(`controller_scans_${controller.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scan_logs',
          filter: `controller_id=eq.${controller.id}`,
        },
        () => {
          // Rafraîchir les scans quand il y a un changement pour ce contrôleur
          if (mounted) {
            fetchScans()
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [controller, filters])

  const fetchScans = async () => {
    if (!controller) return

    setLoading(true)
    try {
      let query = supabase
        .from('scan_logs')
        .select(`
          *,
          students:student_id (
            id,
            nom,
            prenom,
            contact,
            classe,
            statut_paiement
          )
        `)
        .eq('controller_id', controller.id)
        .order('scanned_at', { ascending: false })

      // Filtres
      if (filters.dateFrom) {
        query = query.gte('scanned_at', new Date(filters.dateFrom).toISOString())
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('scanned_at', endDate.toISOString())
      }
      if (filters.statut !== 'all') {
        query = query.eq('statut', filters.statut)
      }

      const { data, error } = await query

      if (error) throw error
      setScans(data || [])

      // Calculer les statistiques
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const todayScans = (data || []).filter(s => new Date(s.scanned_at) >= today)
      const weekScans = (data || []).filter(s => new Date(s.scanned_at) >= weekAgo)
      const approvedScans = (data || []).filter(s => s.statut === STATUTS_SCAN.APPROVED)

      setStats({
        today: todayScans.length,
        week: weekScans.length,
        successRate: data && data.length > 0 
          ? Math.round((approvedScans.length / data.length) * 100) 
          : 0,
      })
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Date/Heure', 'Étudiant', 'Statut', 'Raison']
    const rows = scans.map(scan => [
      formatDateTime(scan.scanned_at),
      `${scan.students?.nom || ''} ${scan.students?.prenom || ''}`,
      scan.statut,
      scan.raison || '',
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historique-scans-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export CSV réussi')
  }

  if (!controller) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emsp-green/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageTransition>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <AnimatedButton
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    // Vibration pour feedback
                    if ('vibrate' in navigator) {
                      navigator.vibrate(10)
                    }
                    
                    // Précharger ScanQR avant navigation
                    import('./ScanQR').then(() => {
                      startTransition(() => {
                        navigate('/scan')
                      })
                    }).catch(() => {
                      startTransition(() => {
                        navigate('/scan')
                      })
                    })
                  }}
                  className="flex items-center space-x-2 touch-manipulation"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                  type="button"
                >
                  <ArrowLeft size={20} />
                  <span>Retour</span>
                </AnimatedButton>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
                    Mon Historique
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {controller.name} - {controller.line_name}
                  </p>
                </div>
              </div>
              <AnimatedButton
                variant="secondary"
                onClick={handleExportCSV}
                className="flex items-center space-x-2"
              >
                <Download size={20} />
                <span>Export CSV</span>
              </AnimatedButton>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimatedCard delay={0.1} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Scans aujourd'hui</p>
                    <p className="text-3xl font-bold text-emsp-green">{stats.today}</p>
                  </div>
                  <Calendar className="text-emsp-green" size={32} />
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.2} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Scans cette semaine</p>
                    <p className="text-3xl font-bold text-emsp-yellow">{stats.week}</p>
                  </div>
                  <Calendar className="text-emsp-yellow" size={32} />
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.3} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Taux de réussite</p>
                    <p className="text-3xl font-bold text-emsp-lightGreen">{stats.successRate}%</p>
                  </div>
                  <Filter className="text-emsp-lightGreen" size={32} />
                </div>
              </AnimatedCard>
            </div>

            {/* Filtres */}
            <AnimatedCard delay={0.4} className="p-6">
              <h2 className="text-lg font-semibold text-emsp-green mb-4 flex items-center">
                <Filter size={20} className="mr-2" />
                Filtres
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={filters.statut}
                    onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value={STATUTS_SCAN.APPROVED}>Approuvé</option>
                    <option value={STATUTS_SCAN.EXPIRED}>Expiré</option>
                    <option value={STATUTS_SCAN.WRONG_LINE}>Mauvaise ligne</option>
                    <option value={STATUTS_SCAN.DUPLICATE}>Doublon</option>
                  </select>
                </div>
              </div>
            </AnimatedCard>

            {/* Liste des scans */}
            <AnimatedCard delay={0.5} className="p-6">
              <h2 className="text-lg font-semibold text-emsp-green mb-4">
                Historique des scans ({scans.length})
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emsp-yellow mx-auto"></div>
                </div>
              ) : scans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun scan enregistré
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date/Heure</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Étudiant</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Raison</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scans.map((scan) => (
                        <tr key={scan.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{formatDateTime(scan.scanned_at)}</td>
                          <td className="py-3 px-4">
                            {scan.students?.nom || ''} {scan.students?.prenom || ''}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              scan.statut === STATUTS_SCAN.APPROVED
                                ? 'bg-green-100 text-green-800'
                                : scan.statut === STATUTS_SCAN.EXPIRED
                                ? 'bg-red-100 text-red-800'
                                : scan.statut === STATUTS_SCAN.WRONG_LINE
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {scan.statut}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {scan.raison || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AnimatedCard>
          </div>
        </PageTransition>
      </div>
    </div>
  )
}

