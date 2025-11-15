import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Plus, Edit, Trash2 } from 'lucide-react'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import AnimatedModal from '../components/ui/AnimatedModal'
import { Input } from '../components/ui'
import PageTransition from '../components/ui/PageTransition'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function AdminNiveaux() {
  const { isAdmin } = useAuth()
  const [niveaux, setNiveaux] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNiveau, setEditingNiveau] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    active: true,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isAdmin) return
    fetchNiveaux()
  }, [isAdmin])

  const fetchNiveaux = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('niveaux')
        .select('*')
        .order('nom', { ascending: true })

      if (error) throw error
      setNiveaux(data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des niveaux')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du niveau est requis'
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
      if (editingNiveau) {
        const { error } = await supabase
          .from('niveaux')
          .update({
            nom: formData.nom.trim(),
            active: formData.active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNiveau.id)

        if (error) throw error
        toast.success('Niveau mis à jour avec succès')
      } else {
        // Vérifier si le nom existe déjà
        const { data: existing } = await supabase
          .from('niveaux')
          .select('id')
          .eq('nom', formData.nom.trim())
          .single()

        if (existing) {
          setErrors({ nom: 'Ce niveau existe déjà' })
          return
        }

        const { error } = await supabase
          .from('niveaux')
          .insert([{
            nom: formData.nom.trim(),
            active: formData.active,
          }])

        if (error) throw error
        toast.success('Niveau créé avec succès')
      }

      setShowForm(false)
      setEditingNiveau(null)
      setFormData({ nom: '', active: true })
      setErrors({})
      fetchNiveaux()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement')
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce niveau ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('niveaux')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Niveau supprimé')
      fetchNiveaux()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    }
  }

  const handleEdit = (niveau) => {
    setEditingNiveau(niveau)
    setFormData({
      nom: niveau.nom || '',
      active: niveau.active ?? true,
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingNiveau(null)
    setFormData({ nom: '', active: true })
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
                Gestion des Niveaux
              </h1>
              <p className="text-gray-600 mt-1">
                Créer et modifier les niveaux disponibles
              </p>
            </div>
            <AnimatedButton onClick={handleNew} className="flex items-center space-x-2">
              <Plus size={20} />
              <span>Nouveau niveau</span>
            </AnimatedButton>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto"></div>
            </div>
          ) : (
            <AnimatedCard delay={0.1} className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Nom</th>
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {niveaux.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-gray-500">
                          Aucun niveau enregistré
                        </td>
                      </tr>
                    ) : (
                      niveaux.map((niveau) => (
                        <tr key={niveau.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-lg">{niveau.nom}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              niveau.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {niveau.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(niveau)}
                                className="px-3 py-1 text-sm bg-emsp-yellow hover:bg-emsp-yellow/80 text-emsp-green rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(niveau.id)}
                                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </AnimatedCard>
          )}

          {/* Modal Formulaire */}
          <AnimatedModal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingNiveau(null)
              setFormData({ nom: '', active: true })
              setErrors({})
            }}
            title={editingNiveau ? 'Modifier le niveau' : 'Nouveau niveau'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom du niveau *"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                error={errors.nom}
                required
                placeholder="Ex: Licence 1, Master, 2024-2025"
              />

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                  />
                  <span className="text-sm font-medium text-gray-700">Niveau actif</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <AnimatedButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingNiveau(null)
                    setFormData({ nom: '', active: true })
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
                  {editingNiveau ? 'Modifier' : 'Créer'}
                </AnimatedButton>
              </div>
            </form>
          </AnimatedModal>
        </div>
      </PageTransition>
    </Layout>
  )
}

