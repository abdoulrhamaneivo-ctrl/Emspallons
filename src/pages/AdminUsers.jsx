import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Plus, Edit, Trash2, Mail, User, Shield, KeyRound, Crown, Send, CheckCircle, XCircle } from 'lucide-react'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import AnimatedModal from '../components/ui/AnimatedModal'
import { Input, Select } from '../components/ui'
import PageTransition from '../components/ui/PageTransition'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'
import PromoteAdminModal from '../components/admin/PromoteAdminModal'
import ResetPasswordModal from '../components/admin/ResetPasswordModal'
import logger from '../lib/logger'

export default function AdminUsers() {
  const { isAdmin, role } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    password: '',
    role: ROLES.EDUCATOR,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAdmin && role !== ROLES.EDUCATOR) return
    fetchUsers()
  }, [isAdmin, role])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Pour chaque utilisateur, vérifier le statut de confirmation email
      // Note: On vérifie via l'API Supabase Auth directement
      const usersWithStatus = await Promise.all(
        (data || []).map(async (profile) => {
          try {
            // Utiliser la fonction Supabase Edge pour récupérer le statut
            const { data: statusData, error: statusError } = await supabase.functions.invoke('get-user-email-status', {
              body: { userId: profile.id }
            })

            if (statusError) {
              // Si la fonction n'existe pas encore, on suppose que l'email n'est pas confirmé
              return { ...profile, email_confirmed: false }
            }

            return {
              ...profile,
              email_confirmed: statusData?.email_confirmed ?? false,
              email_confirmed_at: statusData?.email_confirmed_at ?? null
            }
          } catch (err) {
            logger.debug('Erreur vérification statut email', err)
            return { ...profile, email_confirmed: false }
          }
        })
      )

      setUsers(usersWithStatus)
    } catch (error) {
      logger.error('Erreur lors du chargement des utilisateurs', error)
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour renvoyer l'email de confirmation
  const resendConfirmationEmail = async (userId, email) => {
    try {
      setLoading(true)
      
      // Utiliser la fonction Supabase Edge pour renvoyer l'email
      const { data, error } = await supabase.functions.invoke('resend-confirmation-email', {
        body: { userId, email }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success('Email de confirmation renvoyé avec succès')
      logger.info('Email de confirmation renvoyé', { userId, email })
      
      // Rafraîchir la liste des utilisateurs
      await fetchUsers()
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email de confirmation', error)
      toast.error('Erreur lors de l\'envoi de l\'email : ' + (error.message || error.error || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Format d\'email invalide'
    }
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }
    if (!editingUser && !formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis'
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
      setSaving(true)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const functionName = editingUser ? 'update-user' : 'create-user'

      const payload = {
        email: formData.email.trim(),
        nom: formData.nom.trim(),
        role: formData.role,
        ...(formData.password && { password: formData.password }),
        ...(editingUser && { userId: editingUser.id }),
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      if (editingUser) {
        toast.success('Éducateur mis à jour avec succès')
      } else {
        toast.success('Éducateur créé avec succès. Un email de confirmation a été envoyé.')
      }
      setShowForm(false)
      setEditingUser(null)
      setFormData({ email: '', nom: '', password: '', role: ROLES.EDUCATOR })
      setErrors({})
      fetchUsers()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: id },
      })

      if (error) {
        console.error('Error invoking delete-user:', error)
        throw new Error(error.message || 'Erreur lors de l\'appel de la fonction')
      }

      if (data?.error) {
        console.error('Error from delete-user function:', data.error)
        throw new Error(data.error)
      }

      toast.success('Utilisateur supprimé avec succès')
      fetchUsers()
    } catch (error) {
      console.error('Delete error:', error)
      const errorMessage = error.message || error.error || 'Erreur lors de la suppression'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email || '',
      nom: user.nom || '',
      password: '',
      role: user.role || ROLES.EDUCATOR,
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingUser(null)
    setFormData({ email: '', nom: '', password: '', role: ROLES.EDUCATOR })
    setErrors({})
    setShowForm(true)
  }

  const getRoleLabel = (role) => {
    const labels = {
      [ROLES.ADMIN]: 'Administrateur',
      [ROLES.EDUCATOR]: 'Éducateur',
      [ROLES.CONTROLLER]: 'Contrôleur',
    }
    return labels[role] || role
  }

  const getRoleColor = (role) => {
    const colors = {
      [ROLES.ADMIN]: 'bg-purple-100 text-purple-800',
      [ROLES.EDUCATOR]: 'bg-blue-100 text-blue-800',
      [ROLES.CONTROLLER]: 'bg-green-100 text-green-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
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
                Gestion des Utilisateurs
              </h1>
              <p className="text-gray-600 mt-1">
                {isAdmin ? 'Créer et gérer les comptes éducateurs' : 'Consulter et modifier les comptes éducateurs'}
              </p>
            </div>
            <AnimatedButton onClick={handleNew} className="flex items-center space-x-2">
              <Plus size={20} />
              <span>Nouvel éducateur</span>
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
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Rôle</th>
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Créé le</th>
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">
                          Aucun utilisateur enregistré
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{user.nom}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Mail size={16} className="text-gray-400" />
                              <span>{user.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {user.email_confirmed === true ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle size={14} />
                                <span>Confirmé</span>
                              </span>
                            ) : user.email_confirmed === false ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <XCircle size={14} />
                                <span>Non confirmé</span>
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              {user.role !== ROLES.ADMIN && (
                                <>
                                  <button
                                    onClick={() => handleEdit(user)}
                                    className="px-3 py-1 text-sm bg-emsp-yellow hover:bg-emsp-yellow/80 text-emsp-green rounded-lg transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  {/* Seuls les admins peuvent supprimer des comptes */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDelete(user.id)}
                                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </>
                              )}
                              {/* Bouton Renvoyer email de confirmation (si email non confirmé) */}
                              {(user.email_confirmed === false || user.email_confirmed === null) && (
                                <button
                                  onClick={() => resendConfirmationEmail(user.id, user.email)}
                                  className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
                                  title="Renvoyer l'email de confirmation"
                                >
                                  <Send size={16} />
                                </button>
                              )}
                              {/* Bouton Promouvoir (visible seulement pour éducateurs) */}
                              {user.role === ROLES.EDUCATOR && isAdmin && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowPromoteModal(true)
                                  }}
                                  className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                                  title="Promouvoir en Admin"
                                >
                                  <Crown size={16} />
                                </button>
                              )}
                              {/* Bouton Réinitialiser mot de passe (visible pour tous les admins) */}
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowResetPasswordModal(true)
                                  }}
                                  className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                  title="Réinitialiser le mot de passe"
                                >
                                  <KeyRound size={16} />
                                </button>
                              )}
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
              setEditingUser(null)
              setFormData({ email: '', nom: '', password: '', role: ROLES.EDUCATOR })
              setErrors({})
            }}
            title={editingUser ? 'Modifier l\'éducateur' : 'Nouvel éducateur'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                error={errors.email}
                required
                placeholder="educateur@emsp.com"
                disabled={!!editingUser}
              />

              <Input
                label="Nom complet *"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                error={errors.nom}
                required
                placeholder="Nom de l'éducateur"
              />

              <Input
                label={editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                required={!editingUser}
                placeholder="Minimum 6 caractères"
              />

              <Select
                label="Rôle *"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                error={errors.role}
                required
              >
                <option value={ROLES.EDUCATOR}>Éducateur</option>
                <option value={ROLES.ADMIN}>Administrateur</option>
              </Select>

              <div className="flex gap-3 pt-4">
                <AnimatedButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingUser(null)
                    setFormData({ email: '', nom: '', password: '', role: ROLES.EDUCATOR })
                    setErrors({})
                  }}
                  className="flex-1"
                  disabled={saving}
                >
                  Annuler
                </AnimatedButton>
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : editingUser ? 'Modifier' : 'Créer'}
                </AnimatedButton>
              </div>
            </form>
          </AnimatedModal>

          {/* Modal Promotion Admin */}
          {selectedUser && (
            <PromoteAdminModal
              isOpen={showPromoteModal}
              onClose={() => {
                setShowPromoteModal(false)
                setSelectedUser(null)
              }}
              user={selectedUser}
              onSuccess={() => {
                fetchUsers()
              }}
            />
          )}

          {/* Modal Réinitialiser Mot de Passe */}
          {selectedUser && (
            <ResetPasswordModal
              isOpen={showResetPasswordModal}
              onClose={() => {
                setShowResetPasswordModal(false)
                setSelectedUser(null)
              }}
              user={selectedUser}
              onSuccess={() => {
                fetchUsers()
              }}
            />
          )}
        </div>
      </PageTransition>
    </Layout>
  )
}

