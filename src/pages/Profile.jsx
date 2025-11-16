import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import AnimatedModal from '../components/ui/AnimatedModal'
import PageTransition from '../components/ui/PageTransition'
import DeleteAccountModal from '../components/admin/DeleteAccountModal'
import { User, Mail, Shield, Lock, Trash2, Edit, Send, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ROLES } from '../lib/constants'
import { Input } from '../components/ui'
import logger from '../lib/logger'
import { useEffect } from 'react'

export default function Profile() {
  const { user, profile, isAdmin } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [emailConfirmed, setEmailConfirmed] = useState(null)
  const [checkingEmailStatus, setCheckingEmailStatus] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)

  // Vérifier le statut de confirmation email
  useEffect(() => {
    const checkEmailStatus = async () => {
      if (!user?.id) return
      
      try {
        setCheckingEmailStatus(true)
        // Utiliser la fonction Supabase Edge pour vérifier le statut
        const { data, error } = await supabase.functions.invoke('get-user-email-status', {
          body: { userId: user.id }
        })

        if (!error && data) {
          setEmailConfirmed(data.email_confirmed ?? false)
        } else {
          // Si la fonction n'existe pas, vérifier directement via la session
          setEmailConfirmed(user.email_confirmed_at ? true : false)
        }
      } catch (err) {
        logger.debug('Erreur vérification statut email', err)
        setEmailConfirmed(user.email_confirmed_at ? true : false)
      } finally {
        setCheckingEmailStatus(false)
      }
    }

    checkEmailStatus()
  }, [user])

  // Fonction pour renvoyer l'email de confirmation
  const resendConfirmationEmail = async () => {
    if (!user?.email) {
      toast.error('Email non disponible')
      return
    }

    try {
      setResendingEmail(true)
      
      const { data, error } = await supabase.functions.invoke('resend-confirmation-email', {
        body: { userId: user.id, email: user.email }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success('Email de confirmation renvoyé avec succès. Vérifiez votre boîte mail.')
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email de confirmation', error)
      toast.error('Erreur lors de l\'envoi de l\'email : ' + (error.message || error.error || 'Erreur inconnue'))
    } finally {
      setResendingEmail(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const getRoleColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800'
      case ROLES.EDUCATOR:
        return 'bg-blue-100 text-blue-800'
      case ROLES.CONTROLLER:
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Administrateur'
      case ROLES.EDUCATOR:
        return 'Éducateur'
      case ROLES.CONTROLLER:
        return 'Contrôleur'
      default:
        return role
    }
  }

  const validatePassword = () => {
    const newErrors = {}
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis'
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères'
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePassword()) {
      toast.error('Veuillez corriger les erreurs')
      return
    }

    try {
      setChangingPassword(true)

      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword,
      })

      if (signInError) {
        throw new Error('Mot de passe actuel incorrect')
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) throw updateError

      toast.success('Mot de passe modifié avec succès')
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Erreur lors de la modification du mot de passe')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
            Mon Profil
          </h1>

          {/* Informations personnelles */}
          <AnimatedCard className="p-6">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white ${
                    isAdmin
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                      : 'bg-gradient-to-br from-emsp-yellow to-emsp-lightGreen'
                  }`}
                >
                  {getInitials(profile?.nom || user?.email || 'U')}
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-emsp-green mb-2">Informations personnelles</h2>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Nom complet</p>
                        <p className="font-medium text-gray-900">{profile?.nom || 'Non défini'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="text-gray-400" size={20} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Email</p>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{user?.email || 'Non défini'}</p>
                          {emailConfirmed === true ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={12} />
                              <span>Confirmé</span>
                            </span>
                          ) : emailConfirmed === false ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <XCircle size={12} />
                              <span>Non confirmé</span>
                            </span>
                          ) : checkingEmailStatus ? (
                            <span className="text-xs text-gray-500">Vérification...</span>
                          ) : null}
                        </div>
                        {emailConfirmed === false && (
                          <button
                            onClick={resendConfirmationEmail}
                            disabled={resendingEmail}
                            className="mt-2 px-3 py-1.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-1"
                          >
                            <Send size={12} />
                            <span>{resendingEmail ? 'Envoi...' : 'Renvoyer l\'email de confirmation'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Rôle</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
                            profile?.role
                          )}`}
                        >
                          {getRoleLabel(profile?.role)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* Changer le mot de passe */}
          <AnimatedCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Lock className="text-emsp-green" size={24} />
                <h2 className="text-xl font-semibold text-emsp-green">Sécurité</h2>
              </div>
              <AnimatedButton onClick={() => setShowPasswordModal(true)} variant="outline">
                <Edit size={16} className="mr-2" />
                Changer mon mot de passe
              </AnimatedButton>
            </div>
            <p className="text-sm text-gray-600">
              Assurez-vous d'utiliser un mot de passe fort et unique pour protéger votre compte.
            </p>
          </AnimatedCard>

          {/* Supprimer mon compte (admin uniquement) */}
          {isAdmin && (
            <AnimatedCard className="p-6 border-2 border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <Trash2 className="text-red-600 mt-1" size={24} />
                  <div>
                    <h2 className="text-xl font-semibold text-red-600 mb-1">Zone de danger</h2>
                    <p className="text-sm text-gray-600">
                      La suppression de votre compte est irréversible. Toutes vos données seront perdues.
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 size={16} className="mr-2" />
                  Supprimer mon compte
                </AnimatedButton>
              </div>
            </AnimatedCard>
          )}

          {/* Modal Changer mot de passe */}
          <AnimatedModal
            isOpen={showPasswordModal}
            onClose={() => {
              setShowPasswordModal(false)
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
              setErrors({})
            }}
            title="Changer mon mot de passe"
            size="md"
          >
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Mot de passe actuel"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                error={errors.currentPassword}
                required
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                error={errors.newPassword}
                required
                minLength={8}
              />
              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                required
              />
              <div className="flex space-x-3">
                <AnimatedButton
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setErrors({})
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </AnimatedButton>
                <AnimatedButton type="submit" disabled={changingPassword} className="flex-1">
                  {changingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                </AnimatedButton>
              </div>
            </form>
          </AnimatedModal>

          {/* Modal Supprimer compte */}
          <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
        </div>
      </PageTransition>
    </Layout>
  )
}

