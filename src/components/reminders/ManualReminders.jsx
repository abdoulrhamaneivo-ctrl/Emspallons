import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Users, Send, CheckSquare, Square, X, Filter } from 'lucide-react'
import AnimatedCard from '../ui/AnimatedCard'
import AnimatedButton from '../ui/AnimatedButton'
import AnimatedModal from '../ui/AnimatedModal'
import { Input } from '../ui'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { STATUTS_PAIEMENT } from '../../lib/constants'
import { sendBatchReminders, replaceTemplateVariables } from '../../services/whatsappService'
import { sendWhatsAppMessage } from '../../services/whatsappAutoService'
import logger from '../../lib/logger'
import { format, addDays, differenceInDays } from 'date-fns'
import { PRIX_MENSUEL } from '../../lib/constants'
import { calculatePrice } from '../../utils/priceCalculator'

const AVAILABLE_VARIABLES = [
  { key: 'tuteur', label: 'Nom tuteur' },
  { key: 'nom_etudiant', label: 'Nom étudiant' },
  { key: 'prenom_etudiant', label: 'Prénom étudiant' },
  { key: 'classe', label: 'Classe' },
  { key: 'ligne', label: 'Ligne de car' },
  { key: 'date_expiration', label: 'Date expiration' },
  { key: 'montant', label: 'Montant à payer' },
  { key: 'jours_restants', label: 'Jours restants' },
]

export default function ManualReminders() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [selectedStatuses, setSelectedStatuses] = useState(['all'])
  const [selectedLines, setSelectedLines] = useState(['all'])
  const [selectedClasses, setSelectedClasses] = useState(['all'])
  const [selectedNiveaux, setSelectedNiveaux] = useState(['all'])
  const [selectedStudents, setSelectedStudents] = useState([]) // IDs sélectionnés individuellement
  const [showAdvancedSelection, setShowAdvancedSelection] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Message
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState('')
  
  // Envoi
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 })
  const [sendResults, setSendResults] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchLines()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .order('nom', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des étudiants')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLines = async () => {
    try {
      const { data } = await supabase
        .from('lines')
        .select('*')
        .eq('active', true)
        .order('nom')
      
      if (data) setLines(data)
    } catch (error) {
      console.error('Erreur récupération lignes:', error)
    }
  }

  // Filtrer les étudiants selon les critères
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filtre statut
      if (!selectedStatuses.includes('all') && !selectedStatuses.includes(student.statut_paiement)) {
        return false
      }
      
      // Filtre ligne
      if (!selectedLines.includes('all') && (!student.ligne_id || !selectedLines.includes(student.ligne_id))) {
        return false
      }
      
      // Filtre classe
      if (!selectedClasses.includes('all') && student.classe && !selectedClasses.includes(student.classe)) {
        return false
      }
      
      // Filtre niveau
      if (!selectedNiveaux.includes('all') && student.niveau && !selectedNiveaux.includes(student.niveau)) {
        return false
      }
      
      // Sélection individuelle (si activée)
      if (selectedStudents.length > 0 && !selectedStudents.includes(student.id)) {
        return false
      }
      
      return true
    })
  }, [students, selectedStatuses, selectedLines, selectedClasses, selectedNiveaux, selectedStudents])

  // Statistiques des filtres
  const statusCounts = useMemo(() => {
    const counts = { all: students.length }
    students.forEach(s => {
      counts[s.statut_paiement] = (counts[s.statut_paiement] || 0) + 1
    })
    return counts
  }, [students])

  // Classes et niveaux uniques
  const uniqueClasses = useMemo(() => {
    return [...new Set(students.map(s => s.classe).filter(Boolean))].sort()
  }, [students])

  const uniqueNiveaux = useMemo(() => {
    return [...new Set(students.map(s => s.niveau).filter(Boolean))].sort()
  }, [students])

  // Gestion des filtres multi-select
  const toggleStatus = (status) => {
    if (status === 'all') {
      setSelectedStatuses(['all'])
    } else {
      setSelectedStatuses(prev => {
        const newStatuses = prev.filter(s => s !== 'all')
        if (newStatuses.includes(status)) {
          const filtered = newStatuses.filter(s => s !== status)
          return filtered.length === 0 ? ['all'] : filtered
        } else {
          return [...newStatuses, status]
        }
      })
    }
  }

  const toggleLine = (lineId) => {
    if (lineId === 'all') {
      setSelectedLines(['all'])
    } else {
      setSelectedLines(prev => {
        const newLines = prev.filter(l => l !== 'all')
        if (newLines.includes(lineId)) {
          const filtered = newLines.filter(l => l !== lineId)
          return filtered.length === 0 ? ['all'] : filtered
        } else {
          return [...newLines, lineId]
        }
      })
    }
  }

  const toggleClass = (classe) => {
    if (classe === 'all') {
      setSelectedClasses(['all'])
    } else {
      setSelectedClasses(prev => {
        const newClasses = prev.filter(c => c !== 'all')
        if (newClasses.includes(classe)) {
          const filtered = newClasses.filter(c => c !== classe)
          return filtered.length === 0 ? ['all'] : filtered
        } else {
          return [...newClasses, classe]
        }
      })
    }
  }

  const toggleNiveau = (niveau) => {
    if (niveau === 'all') {
      setSelectedNiveaux(['all'])
    } else {
      setSelectedNiveaux(prev => {
        const newNiveaux = prev.filter(n => n !== 'all')
        if (newNiveaux.includes(niveau)) {
          const filtered = newNiveaux.filter(n => n !== niveau)
          return filtered.length === 0 ? ['all'] : filtered
        } else {
          return [...newNiveaux, niveau]
        }
      })
    }
  }

  // Sélection individuelle
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const selectAllFiltered = () => {
    setSelectedStudents(filteredStudents.map(s => s.id))
  }

  const clearSelection = () => {
    setSelectedStudents([])
  }

  // Recherche dans la sélection avancée
  const searchedStudents = useMemo(() => {
    if (!searchTerm) return students
    const term = searchTerm.toLowerCase()
    return students.filter(s =>
      s.nom?.toLowerCase().includes(term) ||
      s.prenom?.toLowerCase().includes(term) ||
      s.contact?.toLowerCase().includes(term) ||
      s.classe?.toLowerCase().includes(term)
    )
  }, [students, searchTerm])

  // Prévisualisation du message
  useEffect(() => {
    if (message && filteredStudents.length > 0) {
      const firstStudent = filteredStudents[0]
      // Calculer date expiration et montant
      const lastPayment = firstStudent.months_ledger?.[firstStudent.months_ledger.length - 1]
      const expirationDate = lastPayment ? format(new Date(lastPayment + '-01'), 'dd/MM/yyyy') : 'N/A'
      const daysRemaining = lastPayment ? differenceInDays(new Date(lastPayment + '-01'), new Date()) : 0
      
      const previewData = {
        tuteur: firstStudent.tuteur || 'Parent',
        nom_etudiant: firstStudent.nom || '',
        prenom_etudiant: firstStudent.prenom || '',
        classe: firstStudent.classe || '',
        ligne: firstStudent.lines?.nom || '',
        date_expiration: expirationDate,
        montant: `${PRIX_MENSUEL.toLocaleString('fr-FR')} FCFA`,
        jours_restants: daysRemaining.toString(),
      }
      
      setPreview(replaceTemplateVariables(message, previewData))
    } else {
      setPreview('')
    }
  }, [message, filteredStudents])

  // Insérer variable dans le message
  const insertVariable = (variable) => {
    const textarea = document.getElementById('reminder-message')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = message
      const newText = text.substring(0, start) + `{${variable}}` + text.substring(end)
      setMessage(newText)
      
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2)
      }, 0)
    }
  }

  // Préparer les destinataires pour l'envoi
  const prepareRecipients = async () => {
    const recipients = []
    
    for (const student of filteredStudents) {
      if (!student.contact) continue
      
      // Calculer date expiration
      const lastPayment = student.months_ledger?.[student.months_ledger.length - 1]
      const expirationDate = lastPayment ? format(new Date(lastPayment + '-01'), 'dd/MM/yyyy') : 'N/A'
      const daysRemaining = lastPayment ? differenceInDays(new Date(lastPayment + '-01'), new Date()) : 0
      
      // Calculer montant
      const priceInfo = await calculatePrice({
        niveau: student.niveau || null,
        ligne_id: student.ligne_id || null,
      })
      
      recipients.push({
        id: student.id,
        contact: student.contact,
        nom_etudiant: student.nom || '',
        prenom_etudiant: student.prenom || '',
        tuteur: student.tuteur || 'Parent',
        classe: student.classe || '',
        ligne: student.lines?.nom || '',
        date_expiration: expirationDate,
        montant: `${priceInfo.price.toLocaleString('fr-FR')} FCFA`,
        jours_restants: daysRemaining.toString(),
      })
    }
    
    return recipients
  }

  // Envoyer les rappels
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Veuillez entrer un message')
      return
    }
    
    if (filteredStudents.length === 0) {
      toast.error('Aucun destinataire sélectionné')
      return
    }
    
    setShowConfirmModal(true)
  }

  const confirmSend = async () => {
    setShowConfirmModal(false)
    setSending(true)
    setProgress({ current: 0, total: 0, percentage: 0 })
    
    try {
      if (filteredStudents.length === 0) {
        toast.error('Aucun étudiant sélectionné')
        return
      }

      if (!message.trim()) {
        toast.error('Le message est vide')
        return
      }

      let successCount = 0
      let errorCount = 0

      // Envoyer en batch de 10 pour ne pas surcharger
      for (let i = 0; i < filteredStudents.length; i += 10) {
        const batch = filteredStudents.slice(i, i + 10)

        await Promise.all(batch.map(async (student) => {
          try {
            // Remplacer les variables dans le message
            const personalizedMessage = message
              .replace(/{nom}/g, student.nom || '')
              .replace(/{prenom}/g, student.prenom || '')
              .replace(/{classe}/g, student.classe?.nom || student.classe || '')
              .replace(/{ligne}/g, student.lines?.nom || '')
              .replace(/{date_expiration}/g, (() => {
                const lastPayment = student.months_ledger?.[student.months_ledger.length - 1]
                return lastPayment ? format(new Date(lastPayment + '-01'), 'dd/MM/yyyy') : 'N/A'
              })())
              .replace(/{montant}/g, '12 500 FCFA')

            // Envoyer via WhatsApp
            await sendWhatsAppMessage(student.contact, personalizedMessage)
            
            successCount++
          } catch (error) {
            logger.error(`Erreur envoi rappel pour ${student.nom}`, error)
            errorCount++
          }
        }))

        // Mettre à jour la progression
        setProgress({
          current: Math.min(i + 10, filteredStudents.length),
          total: filteredStudents.length,
          percentage: Math.round(((i + 10) / filteredStudents.length) * 100)
        })

        // Pause entre les batchs
        if (i + 10 < filteredStudents.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // Enregistrer dans l'historique
      await supabase.from('reminders_history').insert({
        reminder_type: 'manual',
        recipients_count: filteredStudents.length,
        filters: { 
          statut: selectedStatuses, 
          ligne: selectedLines,
          classes: selectedClasses,
          niveaux: selectedNiveaux,
          individual_selection: selectedStudents.length > 0
        },
        message,
        success_count: successCount,
        error_count: errorCount
      })

      toast.success(`${successCount} rappels envoyés avec succès`)
      if (errorCount > 0) {
        toast.warning(`${errorCount} erreurs lors de l'envoi`)
      }

      setSendResults({
        success: successCount,
        errors: Array(errorCount).fill({ error: 'Erreur lors de l\'envoi' })
      })
      
    } catch (error) {
      logger.error('Erreur envoi rappels', error)
      toast.error('Erreur lors de l\'envoi des rappels')
    } finally {
      setSending(false)
    }
  }

  const downloadReport = () => {
    if (!sendResults) return
    
    const csvContent = [
      ['Contact', 'Nom', 'Statut', 'Lien WhatsApp'],
      ...sendResults.links.map(link => [
        link.contact,
        link.name,
        'Succès',
        link.link,
      ]),
      ...sendResults.errors.map(err => [
        err.contact,
        err.name,
        'Erreur',
        err.error,
      ]),
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Rapport_Rappels_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Filtres */}
      <div className="lg:col-span-1 space-y-4">
        <AnimatedCard className="p-4">
          <h3 className="font-semibold text-emsp-green mb-4 flex items-center">
            <Filter size={18} className="mr-2" />
            Filtres
          </h3>
          
          {/* Filtre Statut */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Statut</p>
            <div className="space-y-2">
              {['all', ...Object.keys(STATUTS_PAIEMENT)].map(status => (
                <label key={status} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                  />
                  <span className="text-sm text-gray-700">
                    {status === 'all' ? 'Tous' : status}
                    {status !== 'all' && ` (${statusCounts[status] || 0})`}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {filteredStudents.length} étudiant(s) sélectionné(s)
            </p>
          </div>

          {/* Filtre Ligne */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Ligne</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLines.includes('all')}
                  onChange={() => toggleLine('all')}
                  className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                />
                <span className="text-sm text-gray-700">Toutes les lignes</span>
              </label>
              {lines.map(line => (
                <label key={line.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLines.includes(line.id)}
                    onChange={() => toggleLine(line.id)}
                    className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                  />
                  <span className="text-sm text-gray-700">{line.nom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtre Classe */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Classe</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClasses.includes('all')}
                  onChange={() => toggleClass('all')}
                  className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                />
                <span className="text-sm text-gray-700">Toutes les classes</span>
              </label>
              {uniqueClasses.map(classe => (
                <label key={classe} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(classe)}
                    onChange={() => toggleClass(classe)}
                    className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                  />
                  <span className="text-sm text-gray-700">{classe}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtre Niveau */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Niveau</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNiveaux.includes('all')}
                  onChange={() => toggleNiveau('all')}
                  className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                />
                <span className="text-sm text-gray-700">Tous les niveaux</span>
              </label>
              {uniqueNiveaux.map(niveau => (
                <label key={niveau} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedNiveaux.includes(niveau)}
                    onChange={() => toggleNiveau(niveau)}
                    className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                  />
                  <span className="text-sm text-gray-700">{niveau}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sélection avancée */}
          <AnimatedButton
            variant="outline"
            onClick={() => setShowAdvancedSelection(true)}
            className="w-full"
          >
            Sélection avancée
          </AnimatedButton>
        </AnimatedCard>
      </div>

      {/* Contenu principal */}
      <div className="lg:col-span-3 space-y-6">
        {/* Aperçu destinataires */}
        <AnimatedCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-emsp-green flex items-center">
              <Users size={18} className="mr-2" />
              Destinataires
            </h3>
            <span className="text-2xl font-bold text-emsp-green">
              {filteredStudents.length}
            </span>
          </div>
          
          {filteredStudents.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">Aperçu (5 premiers) :</p>
              <ul className="space-y-1">
                {filteredStudents.slice(0, 5).map(student => (
                  <li key={student.id} className="text-sm text-gray-700">
                    {student.nom} {student.prenom || ''} - {student.classe}
                  </li>
                ))}
              </ul>
              {filteredStudents.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... et {filteredStudents.length - 5} autre(s)
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun destinataire sélectionné</p>
          )}
        </AnimatedCard>

        {/* Éditeur de message */}
        <AnimatedCard className="p-6">
          <h3 className="font-semibold text-emsp-green mb-4">Message</h3>
          
          {/* Variables disponibles */}
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-2">Variables disponibles :</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => insertVariable(variable.key)}
                  className="px-2 py-1 text-xs bg-emsp-green text-white rounded hover:bg-emsp-green/80 transition-colors"
                >
                  {'{'}{variable.key}{'}'}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="reminder-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-green focus:border-emsp-green"
            placeholder="Entrez votre message avec les variables {variable}..."
            maxLength={1024}
          />
          
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              {message.length} / 1024 caractères (limite WhatsApp)
            </p>
            {message.length > 1024 && (
              <p className="text-xs text-red-600">Message trop long pour WhatsApp</p>
            )}
          </div>

          {/* Prévisualisation */}
          {preview && (
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-800 mb-2">Prévisualisation :</p>
              <div className="bg-white p-3 rounded border border-blue-300 whitespace-pre-wrap text-sm">
                {preview}
              </div>
            </div>
          )}
        </AnimatedCard>

        {/* Bouton Envoyer */}
        <AnimatedButton
          onClick={handleSend}
          disabled={!message.trim() || filteredStudents.length === 0 || sending}
          className="w-full flex items-center justify-center space-x-2"
        >
          <Send size={20} />
          <span>
            {sending ? `Envoi en cours... ${progress.percentage}%` : `Envoyer les rappels (${filteredStudents.length} destinataires)`}
          </span>
        </AnimatedButton>

        {/* Progress bar */}
        {sending && (
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-emsp-green h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}

        {/* Résultats */}
        {sendResults && (
          <AnimatedCard className="p-6">
            <h3 className="font-semibold text-emsp-green mb-4">Résultats de l'envoi</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Succès</p>
                <p className="text-2xl font-bold text-green-600">{sendResults.success}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Erreurs</p>
                <p className="text-2xl font-bold text-red-600">{sendResults.errors.length}</p>
              </div>
            </div>
            
            {sendResults.errors.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-red-600 mb-2">Erreurs :</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {sendResults.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-700">
                      {err.name} ({err.contact}) : {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            <AnimatedButton
              variant="outline"
              onClick={downloadReport}
              className="w-full"
            >
              Télécharger rapport détaillé
            </AnimatedButton>
          </AnimatedCard>
        )}
      </div>

      {/* Modal Sélection avancée */}
      <AnimatedModal
        isOpen={showAdvancedSelection}
        onClose={() => setShowAdvancedSelection(false)}
        title="Sélection avancée"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              icon={Search}
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <div className="flex space-x-2 ml-4">
              <AnimatedButton
                variant="outline"
                onClick={selectAllFiltered}
                className="text-sm"
              >
                Tout sélectionner
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                onClick={clearSelection}
                className="text-sm"
              >
                Tout désélectionner
              </AnimatedButton>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-12"></th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nom</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Classe</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ligne</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {searchedStudents.map(student => (
                  <tr
                    key={student.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleStudentSelection(student.id)}
                  >
                    <td className="px-4 py-2">
                      {selectedStudents.includes(student.id) ? (
                        <CheckSquare className="text-emsp-green" size={20} />
                      ) : (
                        <Square className="text-gray-400" size={20} />
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {student.nom} {student.prenom || ''}
                    </td>
                    <td className="px-4 py-2 text-sm">{student.classe}</td>
                    <td className="px-4 py-2 text-sm">{student.lines?.nom || '-'}</td>
                    <td className="px-4 py-2 text-sm">{student.statut_paiement || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <AnimatedButton onClick={() => setShowAdvancedSelection(false)}>
              Fermer ({selectedStudents.length} sélectionné(s))
            </AnimatedButton>
          </div>
        </div>
      </AnimatedModal>

      {/* Modal Confirmation */}
      <AnimatedModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmer l'envoi"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Vous allez envoyer des rappels à <strong>{filteredStudents.length}</strong> destinataire(s).
          </p>
          <p className="text-sm text-gray-600">
            Les liens WhatsApp seront générés et vous pourrez les ouvrir manuellement ou télécharger le rapport.
          </p>
          <div className="flex gap-3 pt-4">
            <AnimatedButton
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1"
            >
              Annuler
            </AnimatedButton>
            <AnimatedButton
              onClick={confirmSend}
              className="flex-1"
            >
              Confirmer
            </AnimatedButton>
          </div>
        </div>
      </AnimatedModal>
    </div>
  )
}

