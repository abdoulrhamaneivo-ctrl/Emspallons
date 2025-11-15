import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Plus, Edit, Trash2, Users, UserCheck } from 'lucide-react'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import AnimatedModal from '../components/ui/AnimatedModal'
import { Input } from '../components/ui'
import PageTransition from '../components/ui/PageTransition'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { HexColorPicker } from 'react-colorful'
import { logActivity, ACTIONS } from '../lib/activityLogger'

const PRESET_COLORS = [
  '#2D5016', // Vert EMSP
  '#FDB913', // Jaune EMSP
  '#1976D2', // Bleu
  '#DC2626', // Rouge
  '#F97316', // Orange
  '#7CB342', // Vert clair
  '#7B1FA2', // Violet
  '#C2185B', // Rose
]

export default function AdminLignes() {
  const { isAdmin, user } = useAuth()
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLine, setEditingLine] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    couleur: '#2D5016',
    description: '',
    active: true,
  })
  const [errors, setErrors] = useState({})
  const [deleteLine, setDeleteLine] = useState(null)
  const [reassignTo, setReassignTo] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    fetchLines()
  }, [isAdmin])

  const fetchLines = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lines')
        .select('*')
        .order('nom', { ascending: true })

      if (error) throw error
      setLines(data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des lignes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getLineStats = async (lineId) => {
    try {
      // Compter les étudiants
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('ligne_id', lineId)

      // Compter les contrôleurs
      const { count: controllersCount } = await supabase
        .from('controllers')
        .select('*', { count: 'exact', head: true })
        .eq('ligne_id', lineId)

      return {
        students: studentsCount || 0,
        controllers: controllersCount || 0,
      }
    } catch (error) {
      console.error('Erreur stats ligne:', error)
      return { students: 0, controllers: 0 }
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom de la ligne est requis'
    }
    if (!formData.couleur) {
      newErrors.couleur = 'La couleur est requise'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs')
      return
    }

    try {
      if (editingLine) {
        const { error } = await supabase
          .from('lines')
          .update({
            nom: formData.nom.trim(),
            couleur: formData.couleur,
            description: formData.description.trim() || null,
            active: formData.active,
          })
          .eq('id', editingLine.id)

        if (error) throw error
        
        await logActivity({
          action: ACTIONS.UPDATE_LINE,
          entityType: 'line',
          entityId: editingLine.id,
          details: {
            nom: formData.nom,
            couleur: formData.couleur,
          },
        })
        
        toast.success('Ligne mise à jour avec succès')
      } else {
        // Vérifier si le nom existe déjà
        const { data: existing } = await supabase
          .from('lines')
          .select('id')
          .eq('nom', formData.nom.trim())
          .single()

        if (existing) {
          setErrors({ nom: 'Cette ligne existe déjà' })
          return
        }

        const { data: newLine, error } = await supabase
          .from('lines')
          .insert([{
            nom: formData.nom.trim(),
            couleur: formData.couleur,
            description: formData.description.trim() || null,
            active: formData.active,
          }])
          .select()
          .single()

        if (error) throw error
        
        await logActivity({
          action: ACTIONS.CREATE_LINE,
          entityType: 'line',
          entityId: newLine.id,
          details: {
            nom: formData.nom,
            couleur: formData.couleur,
          },
        })
        
        toast.success('Ligne créée avec succès')
      }

      setShowForm(false)
      setEditingLine(null)
      setFormData({ nom: '', couleur: '#2D5016', description: '', active: true })
      setErrors({})
      fetchLines()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement')
      console.error(error)
    }
  }

  const handleDelete = async (lineId) => {
    try {
      const stats = await getLineStats(lineId)
      
      if (stats.students > 0 || stats.controllers > 0) {
        setDeleteLine({ id: lineId, stats })
        return
      }

      // Supprimer directement si aucun assigné
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
        const { error } = await supabase
          .from('lines')
          .delete()
          .eq('id', lineId)

        if (error) throw error
        
        await logActivity({
          action: ACTIONS.DELETE_LINE,
          entityType: 'line',
          entityId: lineId,
        })
        
        toast.success('Ligne supprimée')
        fetchLines()
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteLine) return

    try {
      // Si réassignation demandée
      if (reassignTo && reassignTo !== deleteLine.id) {
        // Réassigner les étudiants
        const { error: studentsError } = await supabase
          .from('students')
          .update({ ligne_id: reassignTo })
          .eq('ligne_id', deleteLine.id)

        if (studentsError) throw studentsError

        // Réassigner les contrôleurs
        const { error: controllersError } = await supabase
          .from('controllers')
          .update({ ligne_id: reassignTo })
          .eq('ligne_id', deleteLine.id)

        if (controllersError) throw controllersError
      }

      // Supprimer la ligne
      const { error } = await supabase
        .from('lines')
        .delete()
        .eq('id', deleteLine.id)

      if (error) throw error
      
      await logActivity({
        action: ACTIONS.DELETE_LINE,
        entityType: 'line',
        entityId: deleteLine.id,
        details: {
          reassigned_to: reassignTo || null,
        },
      })
      
      toast.success('Ligne supprimée avec réassignation')
      setDeleteLine(null)
      setReassignTo('')
      fetchLines()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    }
  }

  const handleEdit = (line) => {
    setEditingLine(line)
    setFormData({
      nom: line.nom || '',
      couleur: line.couleur || '#2D5016',
      description: line.description || '',
      active: line.active ?? true,
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingLine(null)
    setFormData({ nom: '', couleur: '#2D5016', description: '', active: true })
    setErrors({})
    setShowForm(true)
  }

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
                Gestion des Lignes
              </h1>
              <p className="text-gray-600 mt-1">
                Créer et modifier les lignes de bus
              </p>
            </div>
            <AnimatedButton onClick={handleNew} className="flex items-center space-x-2">
              <Plus size={20} />
              <span>Nouvelle ligne</span>
            </AnimatedButton>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lines.map((line) => (
                <LineCard
                  key={line.id}
                  line={line}
                  onEdit={() => handleEdit(line)}
                  onDelete={() => handleDelete(line.id)}
                  getStats={getLineStats}
                />
              ))}
            </div>
          )}

          {/* Modal Formulaire */}
          <AnimatedModal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingLine(null)
              setFormData({ nom: '', couleur: '#2D5016', description: '', active: true })
              setErrors({})
            }}
            title={editingLine ? 'Modifier la ligne' : 'Nouvelle ligne'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom de la ligne *"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                error={errors.nom}
                required
                placeholder="Ex: Yopougon, Cocody"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur *
                </label>
                <div className="space-y-3">
                  {/* Preset couleurs */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, couleur: color }))}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.couleur === color
                            ? 'border-emsp-green scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  
                  {/* Color picker */}
                  <div className="flex items-center space-x-4">
                    <HexColorPicker
                      color={formData.couleur}
                      onChange={(color) => setFormData(prev => ({ ...prev, couleur: color }))}
                      className="w-full"
                    />
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className="w-20 h-20 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: formData.couleur }}
                      />
                      <input
                        type="text"
                        value={formData.couleur}
                        onChange={(e) => setFormData(prev => ({ ...prev, couleur: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                        placeholder="#2D5016"
                      />
                    </div>
                  </div>
                </div>
                {errors.couleur && (
                  <p className="text-red-600 text-xs mt-1">{errors.couleur}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-green focus:border-emsp-green"
                  placeholder="Description de la ligne..."
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                  />
                  <span className="text-sm font-medium text-gray-700">Ligne active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <AnimatedButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingLine(null)
                    setFormData({ nom: '', couleur: '#2D5016', description: '', active: true })
                    setErrors({})
                  }}
                  className="flex-1"
                >
                  Annuler
                </AnimatedButton>
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  {editingLine ? 'Modifier' : 'Créer'}
                </AnimatedButton>
              </div>
            </form>
          </AnimatedModal>

          {/* Modal Suppression avec réassignation */}
          {deleteLine && (
            <AnimatedModal
              isOpen={!!deleteLine}
              onClose={() => {
                setDeleteLine(null)
                setReassignTo('')
              }}
              title="Supprimer la ligne"
              size="md"
            >
              <div className="space-y-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold mb-2">
                    {deleteLine.stats.students} étudiant(s) et {deleteLine.stats.controllers} contrôleur(s) sont assignés à cette ligne.
                  </p>
                  <p className="text-sm text-red-700">
                    Vous devez réassigner ces éléments avant de supprimer la ligne.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Réassigner à une autre ligne *
                  </label>
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-green focus:border-emsp-green"
                    required
                  >
                    <option value="">Sélectionner une ligne</option>
                    {lines
                      .filter(l => l.id !== deleteLine.id && l.active)
                      .map(line => (
                        <option key={line.id} value={line.id}>{line.nom}</option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <AnimatedButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDeleteLine(null)
                      setReassignTo('')
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </AnimatedButton>
                  <AnimatedButton
                    type="button"
                    variant="primary"
                    onClick={handleConfirmDelete}
                    disabled={!reassignTo}
                    className="flex-1"
                  >
                    Supprimer et réassigner
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedModal>
          )}
        </div>
      </PageTransition>
    </Layout>
  )
}

// Composant Card pour une ligne
function LineCard({ line, onEdit, onDelete, getStats }) {
  const [stats, setStats] = useState({ students: 0, controllers: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const lineStats = await getStats(line.id)
      setStats(lineStats)
      setLoadingStats(false)
    }
    loadStats()
  }, [line.id, getStats])

  return (
    <AnimatedCard className="p-6 hover:shadow-lg transition-all">
      <div className="space-y-4">
        {/* Header avec cercle coloré */}
        <div className="flex items-center space-x-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: line.couleur || '#2D5016' }}
          >
            {line.nom.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-emsp-green truncate">
              {line.nom}
            </h3>
            {line.description && (
              <p className="text-sm text-gray-600 truncate">{line.description}</p>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            line.active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {line.active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Users size={18} className="text-emsp-green" />
            <div>
              <p className="text-xs text-gray-600">Étudiants</p>
              <p className="text-lg font-bold text-emsp-green">
                {loadingStats ? '...' : stats.students}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck size={18} className="text-emsp-green" />
            <div>
              <p className="text-xs text-gray-600">Contrôleurs</p>
              <p className="text-lg font-bold text-emsp-green">
                {loadingStats ? '...' : stats.controllers}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 text-sm bg-emsp-yellow hover:bg-emsp-yellow/80 text-emsp-green rounded-lg transition-colors flex items-center justify-center space-x-1"
          >
            <Edit size={16} />
            <span>Modifier</span>
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center justify-center space-x-1"
          >
            <Trash2 size={16} />
            <span>Supprimer</span>
          </button>
        </div>
      </div>
    </AnimatedCard>
  )
}

