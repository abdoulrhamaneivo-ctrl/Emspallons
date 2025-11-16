import { useState, useMemo, useEffect } from 'react'
import { useStudents } from '../../hooks/useStudents'
import { Search, Plus, Edit, DollarSign, QrCode, Trash2, Filter, X, Upload, Download, CreditCard, GraduationCap } from 'lucide-react'
import { Button, Badge, Card } from '../ui'
import EmptyState from '../ui/EmptyState'
import InfoTooltip from '../ui/InfoTooltip'
import StudentForm from './StudentForm'
import PaymentModal from '../payments/PaymentModal'
import QRCodeDisplay from './QRCodeDisplay'
import StudentCardModal from './StudentCardModal'
import ImportExportModal from './ImportExportModal'
import { STATUTS_PAIEMENT } from '../../lib/constants'
import { getStatusColor, getStatusLabel } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function StudentList() {
  const {
    students,
    loading,
    stats,
    deleteStudent,
    regenerateQRCode,
  } = useStudents()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLine, setSelectedLine] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedNiveau, setSelectedNiveau] = useState('all')
  const [selectedClasse, setSelectedClasse] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [paymentStudent, setPaymentStudent] = useState(null)
  const [qrStudent, setQrStudent] = useState(null)
  const [cardStudent, setCardStudent] = useState(null)
  const [lines, setLines] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)

  // Écouter l'événement pour ouvrir le formulaire depuis le dashboard
  useEffect(() => {
    const handleOpenForm = () => {
      setShowForm(true)
      setEditingStudent(null)
    }
    window.addEventListener('open-student-form', handleOpenForm)
    return () => {
      window.removeEventListener('open-student-form', handleOpenForm)
    }
  }, [])

  // Charger les lignes
  useEffect(() => {
    const fetchLines = async () => {
      const { data } = await supabase
        .from('lines')
        .select('*')
        .eq('active', true)
        .order('nom')
      
      if (data) setLines(data)
    }
    fetchLines()
  }, [])

  // Extraire les niveaux et classes uniques
  const niveaux = useMemo(() => {
    const unique = [...new Set(students.map((s) => s.niveau).filter(Boolean))]
    return unique.sort()
  }, [students])

  const classes = useMemo(() => {
    const unique = [...new Set(students.map((s) => s.classe).filter(Boolean))]
    return unique.sort()
  }, [students])

  // Filtrer les étudiants
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Recherche
      const searchMatch =
        !searchTerm ||
        `${student.nom} ${student.prenom || ''} ${student.contact || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      // Filtre ligne
      const lineMatch =
        selectedLine === 'all' ||
        (student.ligne_id && student.ligne_id === selectedLine) ||
        (student.lines && student.lines.id === selectedLine)

      // Filtre statut
      const statusMatch =
        selectedStatus === 'all' || student.statut_paiement === selectedStatus

      // Filtre niveau
      const niveauMatch =
        selectedNiveau === 'all' || student.niveau === selectedNiveau

      // Filtre classe
      const classeMatch =
        selectedClasse === 'all' || student.classe === selectedClasse

      return (
        searchMatch && lineMatch && statusMatch && niveauMatch && classeMatch
      )
    })
  }, [students, searchTerm, selectedLine, selectedStatus, selectedNiveau, selectedClasse])

  const handleDelete = async (student) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${student.nom} ${student.prenom || ''} ?`
      )
    ) {
      await deleteStudent(student.id)
    }
  }

  const getInitials = (nom, prenom) => {
    const first = nom?.charAt(0)?.toUpperCase() || ''
    const second = prenom?.charAt(0)?.toUpperCase() || ''
    return first + second || '??'
  }

  const getLineColor = (line) => {
    if (!line) return 'bg-gray-200'
    return line.couleur || 'bg-emsp-green'
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-emsp-green to-emsp-green-light text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-2 border-green-200">
          <div>
            <p className="text-sm text-gray-600">Actifs</p>
            <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
          </div>
        </Card>

        <Card className="bg-yellow-50 border-2 border-yellow-200">
          <div>
            <p className="text-sm text-gray-600">En retard</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.enRetard}</p>
          </div>
        </Card>

        <Card className="bg-red-50 border-2 border-red-200">
          <div>
            <p className="text-sm text-gray-600">Expirés</p>
            <p className="text-2xl font-bold text-red-600">{stats.expires}</p>
          </div>
        </Card>

        <Card className="bg-gray-50 border-2 border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Hors service</p>
            <p className="text-2xl font-bold text-gray-600">{stats.horsService}</p>
          </div>
        </Card>
      </div>

      {/* Barre de recherche et actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-yellow focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter size={18} />
            <span>Filtres</span>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportExport(true)}
            className="flex items-center space-x-2"
          >
            <Upload size={20} />
            <span>Import/Export</span>
          </Button>
          <Button
            onClick={() => {
              setEditingStudent(null)
              setShowForm(true)
            }}
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Ajouter un étudiant</span>
          </Button>
        </div>
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
            {/* Filtre ligne */}
            <div>
              <label className="label">Ligne de car</label>
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="input"
              >
                <option value="all">Toutes les lignes</option>
                {lines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre niveau */}
            <div>
              <label className="label">Niveau</label>
              <select
                value={selectedNiveau}
                onChange={(e) => setSelectedNiveau(e.target.value)}
                className="input"
              >
                <option value="all">Tous les niveaux</option>
                {niveaux.map((niveau) => (
                  <option key={niveau} value={niveau}>
                    {niveau}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre classe */}
            <div>
              <label className="label">Classe</label>
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="input"
              >
                <option value="all">Toutes les classes</option>
                {classes.map((classe) => (
                  <option key={classe} value={classe}>
                    {classe}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre statut */}
            <div>
              <label className="label">Statut paiement</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="all">Tous les statuts</option>
                <option value={STATUTS_PAIEMENT.ACTIF}>Actif</option>
                <option value={STATUTS_PAIEMENT.EN_RETARD}>En retard</option>
                <option value={STATUTS_PAIEMENT.EXPIRE}>Expiré</option>
                <option value={STATUTS_PAIEMENT.HORS_SERVICE}>Hors service</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs pour statut (optionnel) */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedStatus === 'all'
              ? 'bg-emsp-yellow text-emsp-green'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous ({stats.total})
        </button>
        <button
          onClick={() => setSelectedStatus(STATUTS_PAIEMENT.ACTIF)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedStatus === STATUTS_PAIEMENT.ACTIF
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Actifs ({stats.actifs})
        </button>
        <button
          onClick={() => setSelectedStatus(STATUTS_PAIEMENT.EN_RETARD)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedStatus === STATUTS_PAIEMENT.EN_RETARD
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En retard ({stats.enRetard})
        </button>
        <button
          onClick={() => setSelectedStatus(STATUTS_PAIEMENT.EXPIRE)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedStatus === STATUTS_PAIEMENT.EXPIRE
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Expirés ({stats.expires})
        </button>
      </div>

      {/* Liste des étudiants */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des étudiants...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Aucun étudiant trouvé</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
            >
              {/* En-tête avec photo placeholder */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 bg-emsp-yellow rounded-full flex items-center justify-center text-emsp-green font-bold text-xl flex-shrink-0">
                  {getInitials(student.nom, student.prenom)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-emsp-green truncate">
                    {student.nom} {student.prenom || ''}
                  </h3>
                  <p className="text-sm text-gray-600">{student.classe}</p>
                  <p className="text-xs text-gray-500">{student.niveau}</p>
                </div>
              </div>

              {/* Informations */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Contact:</span>
                  <span className="text-sm font-medium">{student.contact}</span>
                </div>
                {student.point_ramassage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Point:</span>
                    <span className="text-sm font-medium truncate ml-2">
                      {student.point_ramassage}
                    </span>
                  </div>
                )}
                {student.lines && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ligne:</span>
                    <Badge
                      status={null}
                      className="text-xs"
                      style={{ backgroundColor: student.lines.couleur || '#7CB342', color: 'white' }}
                    >
                      {student.lines.nom}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Statut paiement */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <Badge status={student.statut_paiement}>
                    {getStatusLabel(student.statut_paiement)}
                  </Badge>
                  {student.months_ledger && (() => {
                    const currentMonth = new Date().toISOString().slice(0, 7)
                    const futureSessions = student.months_ledger.filter(s => s > currentMonth)
                    if (futureSessions.length > 0) {
                      return (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Paiement anticipé
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setEditingStudent(student)
                    setShowForm(true)
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  title="Modifier"
                >
                  <Edit size={16} />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => setPaymentStudent(student)}
                  className="flex-1 px-3 py-2 text-sm bg-emsp-yellow hover:bg-yellow-500 text-emsp-green rounded-lg transition-colors flex items-center justify-center space-x-1"
                  title="Payer"
                >
                  <DollarSign size={16} />
                  <span>Payer</span>
                </button>
                <button
                  onClick={() => setCardStudent(student)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-1"
                  title="Voir la carte"
                >
                  <CreditCard size={16} />
                  <span>Carte</span>
                </button>
                <button
                  onClick={() => setQrStudent(student)}
                  className="flex-1 px-3 py-2 text-sm bg-emsp-green hover:bg-green-800 text-white rounded-lg transition-colors flex items-center justify-center space-x-1"
                  title="QR Code"
                >
                  <QrCode size={16} />
                  <span>QR</span>
                </button>
                <button
                  onClick={() => handleDelete(student)}
                  className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <StudentForm
          student={editingStudent}
          onClose={() => {
            setShowForm(false)
            setEditingStudent(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingStudent(null)
          }}
        />
      )}

      {paymentStudent && (
        <PaymentModal
          student={paymentStudent}
          onClose={() => setPaymentStudent(null)}
          onSuccess={() => setPaymentStudent(null)}
        />
      )}

      {qrStudent && (
        <QRCodeDisplay
          student={qrStudent}
          onClose={() => setQrStudent(null)}
          onRegenerate={regenerateQRCode}
        />
      )}

      {cardStudent && (
        <StudentCardModal
          isOpen={!!cardStudent}
          onClose={() => setCardStudent(null)}
          student={cardStudent}
        />
      )}

      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        students={students}
        lines={lines}
        onImportSuccess={() => {
          // Le hook useStudents se mettra à jour automatiquement
        }}
      />
    </div>
  )
}

