import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit, Trash2, RefreshCw, KeyRound } from 'lucide-react'
import { Button, Badge, Card, Input, Select } from '../ui'
import CreateControllerModal from './CreateControllerModal'
import ResetControllerPasswordModal from './ResetControllerPasswordModal'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../lib/constants'
import logger from '../../lib/logger'

export default function ControllerManager() {
  const { isAdmin, role, user } = useAuth()
  const [controllers, setControllers] = useState([])
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedController, setSelectedController] = useState(null)
  const [editingController, setEditingController] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    ligne_id: '',
    active: true,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isAdmin && role !== ROLES.EDUCATOR) return
    fetchControllers()
    fetchLines()
  }, [isAdmin, role])

  const fetchControllers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('controllers')
        .select(`
          *,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setControllers(data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des contrôleurs')
      logger.error('Erreur chargement contrôleurs', error)
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
      logger.error('Erreur chargement lignes', error)
    }
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const part1 = Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
    const part2 = Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
    return `${part1}-${part2}`
  }

  const handleGenerateCode = () => {
    setFormData((prev) => ({ ...prev, code: generateCode() }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Le code est requis'
    } else {
      const codeRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/
      if (!codeRegex.test(formData.code.toUpperCase())) {
        newErrors.code = 'Format invalide (XXXX-XXXX)'
      }
    }

    if (!formData.ligne_id) {
      newErrors.ligne_id = 'La ligne est requise'
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
      const dataToSubmit = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        ...(editingController ? {} : { created_by: user?.id || null }),
      }

      if (editingController) {
        const { error } = await supabase
          .from('controllers')
          .update(dataToSubmit)
          .eq('id', editingController.id)

        if (error) throw error
        toast.success('Contrôleur mis à jour')
      } else {
        // Vérifier si le code existe déjà
        const { data: existing, error: existingError } = await supabase
          .from('controllers')
          .select('id')
          .eq('code', dataToSubmit.code)
          .maybeSingle()

        if (existingError && existingError.code !== 'PGRST116') {
          throw existingError
        }

        if (existing) {
          setErrors({ code: 'Ce code existe déjà' })
          return
        }

        const { error } = await supabase
          .from('controllers')
          .insert([dataToSubmit])

        if (error) throw error
        toast.success('Contrôleur créé')
      }

      setShowForm(false)
      setEditingController(null)
      setFormData({ nom: '', code: '', ligne_id: '', active: true })
      setErrors({})
      fetchControllers()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement')
      logger.error('Erreur enregistrement contrôleur', error)
    }
  }

  const handleDelete = async (controller) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le contrôleur "${controller.nom}" ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('controllers')
        .delete()
        .eq('id', controller.id)

      if (error) {
        // Vérifier si c'est une erreur de permission
        if (error.message?.includes('policy') || error.code === '42501') {
          toast.error('Vous n\'avez pas la permission de supprimer ce contrôleur. Seuls les admins peuvent supprimer n\'importe quel contrôleur.')
        } else {
          throw error
        }
        return
      }
      
      toast.success('Contrôleur supprimé')
      fetchControllers()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression')
      logger.error('Erreur suppression contrôleur', error)
    }
  }

  const canModifyPassword = (controller) => {
    // Les admins peuvent modifier tous les mots de passe
    if (isAdmin) return true
    // Les créateurs peuvent modifier leurs propres contrôleurs
    return controller.created_by === user?.id
  }

  const canDelete = (controller) => {
    // Les admins peuvent supprimer tous les contrôleurs
    if (isAdmin) return true
    // Les créateurs peuvent supprimer leurs propres contrôleurs
    return controller.created_by === user?.id
  }

  const handleEdit = (controller) => {
    setEditingController(controller)
    setFormData({
      nom: controller.nom || '',
      code: controller.code || '',
      ligne_id: controller.ligne_id || '',
      active: controller.active ?? true,
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setShowCreateModal(true)
  }

  if (!isAdmin && role !== ROLES.EDUCATOR) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Accès réservé aux administrateurs et éducateurs</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emsp-green">
          Gestion des Contrôleurs
        </h1>
        <Button onClick={handleNew} className="flex items-center space-x-2">
          <Plus size={20} />
          <span>Nouveau contrôleur</span>
        </Button>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-emsp-green">
                {editingController ? 'Modifier' : 'Nouveau'} contrôleur
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingController(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom *"
                value={formData.nom}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nom: e.target.value }))
                }
                error={errors.nom}
                required
              />

              <div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Input
                      label="Code *"
                      value={formData.code}
                      onChange={(e) => {
                        const value = e.target.value
                          .toUpperCase()
                          .replace(/[^0-9A-Z-]/g, '')
                          .replace(/(.{4})(?=.)/g, '$1-')
                          .slice(0, 9)
                        setFormData((prev) => ({ ...prev, code: value }))
                      }}
                      placeholder="XXXX-XXXX"
                      error={errors.code}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateCode}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw size={18} />
                    <span>Générer</span>
                  </Button>
                </div>
              </div>

              <Select
                label="Ligne *"
                value={formData.ligne_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ligne_id: e.target.value }))
                }
                error={errors.ligne_id}
                required
              >
                <option value="">Sélectionner une ligne</option>
                {lines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.nom}
                  </option>
                ))}
              </Select>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, active: e.target.checked }))
                  }
                  className="w-4 h-4 text-emsp-green rounded focus:ring-emsp-yellow"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Actif
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingController(null)
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingController ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Liste */}
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
                    Nom
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Ligne
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-emsp-green">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {controllers.map((controller) => (
                  <tr
                    key={controller.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{controller.nom}</td>
                    <td className="py-3 px-4 font-mono">{controller.code}</td>
                    <td className="py-3 px-4">
                      {controller.lines ? (
                        <Badge
                          style={{
                            backgroundColor: controller.lines.couleur || '#7CB342',
                            color: 'white',
                          }}
                        >
                          {controller.lines.nom}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        status={controller.active ? 'success' : 'default'}
                      >
                        {controller.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(controller)}
                          className="text-emsp-green hover:text-emsp-green-light"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        {canModifyPassword(controller) && (
                          <button
                            onClick={() => {
                              setSelectedController(controller)
                              setShowResetPasswordModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            title="Modifier le mot de passe"
                          >
                            <KeyRound size={18} />
                          </button>
                        )}
                        {canDelete(controller) && (
                          <button
                            onClick={() => handleDelete(controller)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateControllerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchControllers()
        }}
        lines={lines}
      />

      {selectedController && (
        <ResetControllerPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false)
            setSelectedController(null)
          }}
          controller={selectedController}
          onSuccess={() => {
            fetchControllers()
          }}
        />
      )}
    </div>
  )
}

