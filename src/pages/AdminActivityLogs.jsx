import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { History, Filter, Download, Search, User, Calendar, FileText } from 'lucide-react'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import PageTransition from '../components/ui/PageTransition'
import { Input } from '../components/ui'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { formatDateTime } from '../lib/utils'

export default function AdminActivityLogs() {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: 'all',
    entityType: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  useEffect(() => {
    if (!isAdmin) return
    fetchLogs()
  }, [isAdmin, filters])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          user:user_id (
            id,
            nom,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      // Filtres
      if (filters.action !== 'all') {
        query = query.eq('action', filters.action)
      }
      if (filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', new Date(filters.dateFrom).toISOString())
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Filtre de recherche côté client
      let filteredData = data || []
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(log => {
          const action = log.action?.toLowerCase() || ''
          const entityType = log.entity_type?.toLowerCase() || ''
          const userName = log.user?.nom?.toLowerCase() || ''
          const userEmail = log.user?.email?.toLowerCase() || ''
          const details = JSON.stringify(log.details || {}).toLowerCase()
          
          return action.includes(searchLower) ||
                 entityType.includes(searchLower) ||
                 userName.includes(searchLower) ||
                 userEmail.includes(searchLower) ||
                 details.includes(searchLower)
        })
      }

      setLogs(filteredData)
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Date/Heure', 'Utilisateur', 'Action', 'Type', 'ID Entité', 'Détails']
    const rows = logs.map(log => [
      formatDateTime(log.created_at),
      log.user?.nom || log.user?.email || 'Système',
      log.action || '',
      log.entity_type || '',
      log.entity_id || '',
      JSON.stringify(log.details || {}),
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historique-activites-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export CSV réussi')
  }

  const getActionLabel = (action) => {
    const labels = {
      'create_student': 'Création étudiant',
      'update_student': 'Modification étudiant',
      'delete_student': 'Suppression étudiant',
      'create_payment': 'Création paiement',
      'generate_receipt': 'Génération reçu',
      'create_controller': 'Création contrôleur',
      'update_controller': 'Modification contrôleur',
      'delete_controller': 'Suppression contrôleur',
      'create_user': 'Création utilisateur',
      'update_user': 'Modification utilisateur',
      'delete_user': 'Suppression utilisateur',
      'promote_to_admin': 'Promotion admin',
      'reset_user_password': 'Réinitialisation mot de passe',
      'create_class': 'Création classe',
      'update_class': 'Modification classe',
      'delete_class': 'Suppression classe',
      'create_niveau': 'Création niveau',
      'update_niveau': 'Modification niveau',
      'delete_niveau': 'Suppression niveau',
      'scan_qr_code': 'Scan QR code',
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'import_students': 'Import étudiants',
      'export_students': 'Export étudiants',
    }
    return labels[action] || action
  }

  const getActionColor = (action) => {
    if (action?.includes('create')) return 'bg-green-100 text-green-800'
    if (action?.includes('update')) return 'bg-blue-100 text-blue-800'
    if (action?.includes('delete')) return 'bg-red-100 text-red-800'
    if (action?.includes('promote') || action?.includes('reset')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  // Extraire les actions et types uniques pour les filtres
  const uniqueActions = [...new Set(logs.map(log => log.action).filter(Boolean))]
  const uniqueEntityTypes = [...new Set(logs.map(log => log.entity_type).filter(Boolean))]

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
      <PageTransition>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
                Historique des Activités
              </h1>
              <p className="text-gray-600 mt-1">
                Traçabilité complète de toutes les actions sur la plateforme
              </p>
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

          {/* Filtres */}
          <AnimatedCard delay={0.1} className="p-6">
            <h2 className="text-lg font-semibold text-emsp-green mb-4 flex items-center">
              <Filter size={20} className="mr-2" />
              Filtres
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recherche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Rechercher..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-green focus:border-emsp-green"
                >
                  <option value="all">Toutes les actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{getActionLabel(action)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </AnimatedCard>

          {/* Liste des logs */}
          <AnimatedCard delay={0.2} className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Aucune activité enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-emsp-lightGreen hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                          {log.entity_type && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {log.entity_type}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {log.user && (
                            <div className="flex items-center space-x-1">
                              <User size={16} />
                              <span>{log.user.nom || log.user.email}</span>
                              {log.user.role && (
                                <span className="text-xs text-gray-500">({log.user.role})</span>
                              )}
                            </div>
                          )}
                          {log.entity_id && (
                            <div className="flex items-center space-x-1">
                              <FileText size={16} />
                              <span className="font-mono text-xs">{log.entity_id.substring(0, 8)}</span>
                            </div>
                          )}
                        </div>

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <pre className="whitespace-pre-wrap text-gray-600">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AnimatedCard>
        </div>
      </PageTransition>
    </Layout>
  )
}

