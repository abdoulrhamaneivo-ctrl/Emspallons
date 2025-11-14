import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Download, Filter, X } from 'lucide-react'
import { Button, Badge, Card } from '../ui'
import { STATUTS_SCAN } from '../../lib/constants'
import { formatDateTime, getStatusColor, getStatusLabel } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function ScanHistory() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    controllerId: 'all',
    statut: 'all',
  })
  const [controllers, setControllers] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchScans()
    fetchControllers()
  }, [])

  const fetchScans = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('scan_logs')
        .select(`
          *,
          students:student_id (
            id,
            nom,
            prenom,
            classe
          ),
          controllers:controller_id (
            id,
            nom
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(100)

      // Appliquer les filtres
      if (filters.dateFrom) {
        query = query.gte('scanned_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('scanned_at', filters.dateTo + 'T23:59:59')
      }
      if (filters.controllerId !== 'all') {
        query = query.eq('controller_id', filters.controllerId)
      }
      if (filters.statut !== 'all') {
        query = query.eq('statut', filters.statut)
      }

      const { data, error } = await query

      if (error) throw error

      // Filtrer par recherche textuelle
      let filtered = data || []
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(
          (scan) =>
            scan.students?.nom?.toLowerCase().includes(searchLower) ||
            scan.students?.prenom?.toLowerCase().includes(searchLower) ||
            scan.controllers?.nom?.toLowerCase().includes(searchLower)
        )
      }

      setScans(filtered)
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchControllers = async () => {
    try {
      const { data } = await supabase
        .from('controllers')
        .select('id, nom')
        .order('nom')

      if (data) setControllers(data)
    } catch (error) {
      console.error('Error fetching controllers:', error)
    }
  }

  useEffect(() => {
    fetchScans()
  }, [filters.dateFrom, filters.dateTo, filters.controllerId, filters.statut])

  const handleExportCSV = () => {
    const headers = ['Date/Heure', 'Étudiant', 'Classe', 'Contrôleur', 'Statut', 'Raison']
    const rows = scans.map((scan) => [
      formatDateTime(scan.scanned_at),
      `${scan.students?.nom || ''} ${scan.students?.prenom || ''}`.trim(),
      scan.students?.classe || '',
      scan.controllers?.nom || '',
      scan.statut,
      scan.raison || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `scan_history_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Export CSV réussi')
  }

  const getStatutBadge = (statut) => {
    const colors = {
      [STATUTS_SCAN.APPROVED]: 'bg-green-100 text-green-800',
      [STATUTS_SCAN.DUPLICATE]: 'bg-yellow-100 text-yellow-800',
      [STATUTS_SCAN.EXPIRED]: 'bg-red-100 text-red-800',
      [STATUTS_SCAN.WRONG_LINE]: 'bg-orange-100 text-orange-800',
    }
    return colors[statut] || 'bg-gray-100 text-gray-800'
  }

  const getStatutLabel = (statut) => {
    const labels = {
      [STATUTS_SCAN.APPROVED]: 'Approuvé',
      [STATUTS_SCAN.DUPLICATE]: 'Doublon',
      [STATUTS_SCAN.EXPIRED]: 'Expiré',
      [STATUTS_SCAN.WRONG_LINE]: 'Mauvaise ligne',
    }
    return labels[statut] || statut
  }

  // Statistiques
  const stats = {
    total: scans.length,
    approved: scans.filter((s) => s.statut === STATUTS_SCAN.APPROVED).length,
    duplicate: scans.filter((s) => s.statut === STATUTS_SCAN.DUPLICATE).length,
    expired: scans.filter((s) => s.statut === STATUTS_SCAN.EXPIRED).length,
    wrongLine: scans.filter((s) => s.statut === STATUTS_SCAN.WRONG_LINE).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emsp-green">Historique des Scans</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter size={18} />
            <span>Filtres</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-emsp-green">{stats.total}</p>
        </Card>
        <Card className="bg-green-50">
          <p className="text-sm text-gray-600">Approuvés</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </Card>
        <Card className="bg-yellow-50">
          <p className="text-sm text-gray-600">Doublons</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.duplicate}</p>
        </Card>
        <Card className="bg-red-50">
          <p className="text-sm text-gray-600">Expirés</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </Card>
        <Card className="bg-orange-50">
          <p className="text-sm text-gray-600">Mauvaise ligne</p>
          <p className="text-2xl font-bold text-orange-600">{stats.wrongLine}</p>
        </Card>
      </div>

      {/* Filtres */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-emsp-green">Filtres</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Nom étudiant/contrôleur..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Date début</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Date fin</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Contrôleur</label>
              <select
                value={filters.controllerId}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, controllerId: e.target.value }))
                }
                className="input"
              >
                <option value="all">Tous</option>
                {controllers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, statut: e.target.value }))
                }
                className="input"
              >
                <option value="all">Tous</option>
                <option value={STATUTS_SCAN.APPROVED}>Approuvé</option>
                <option value={STATUTS_SCAN.DUPLICATE}>Doublon</option>
                <option value={STATUTS_SCAN.EXPIRED}>Expiré</option>
                <option value={STATUTS_SCAN.WRONG_LINE}>Mauvaise ligne</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto"></div>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Date/Heure
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Étudiant
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Classe
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Contrôleur
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Raison
                  </th>
                </tr>
              </thead>
              <tbody>
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Aucun scan trouvé
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => (
                    <tr
                      key={scan.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {formatDateTime(scan.scanned_at)}
                      </td>
                      <td className="py-3 px-4">
                        {scan.students
                          ? `${scan.students.nom || ''} ${scan.students.prenom || ''}`.trim()
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {scan.students?.classe || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {scan.controllers?.nom || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={getStatutBadge(scan.statut)}
                        >
                          {getStatutLabel(scan.statut)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {scan.raison || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

