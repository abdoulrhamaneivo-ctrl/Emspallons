import { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import logger from '../../lib/logger'

const CONFIRMATION_TEXT = 'SUPPRIMER MON COMPTE'

export default function DeleteAccountModal({ isOpen, onClose }) {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [confirmationText, setConfirmationText] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isLastAdmin, setIsLastAdmin] = useState(false)

  useEffect(() => {
    if (isOpen && isAdmin) {
      checkIfLastAdmin()
    }
  }, [isOpen, isAdmin])

  const checkIfLastAdmin = async () => {
    try {
      setChecking(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (error) throw error

      if (data && data.length === 1 && data[0].id === user?.id) {
        setIsLastAdmin(true)
      } else {
        setIsLastAdmin(false)
      }
    } catch (error) {
      console.error('Error checking last admin:', error)
      toast.error('Erreur lors de la vérification')
    } finally {
      setChecking(false)
    }
  }

  const handleDelete = async () => {
    if (isLastAdmin) {
      toast.error('Vous êtes le dernier administrateur. Vous ne pouvez pas supprimer votre compte.')
      return
    }

    try {
      setDeleting(true)

      // Appeler l'Edge Function pour supprimer le compte
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user?.id },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      // Logger dans activity_logs
      try {
        if (user?.id) {
          await supabase.from('activity_logs').insert([
            {
              action: 'ACCOUNT_DELETE',
              entity_type: 'USER',
              user_id: user.id,
              details: {
                deleted_user_email: user?.email,
                deleted_user_nom: user?.nom,
                timestamp: new Date().toISOString()
              },
            },
          ]).catch((logErr) => {
            logger.debug('Impossible d\'enregistrer dans activity_logs', logErr)
          })
        }
      } catch (logError) {
        logger.debug('Erreur lors de l\'enregistrement du log', logError)
      }

      // Clear localStorage
      localStorage.clear()

      // Déconnexion
      await signOut()

      toast.success('Compte supprimé avec succès')
      navigate('/login')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(error.message || 'Erreur lors de la suppression du compte')
    } finally {
      setDeleting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setConfirmationText('')
    setUnderstood(false)
    setIsLastAdmin(false)
    onClose()
  }

  const canContinue = confirmationText === CONFIRMATION_TEXT
  const canConfirm = understood && !isLastAdmin

  if (checking) {
    return (
      <AnimatedModal isOpen={isOpen} onClose={handleClose} title="Vérification...">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification en cours...</p>
        </div>
      </AnimatedModal>
    )
  }

  if (isLastAdmin) {
    return (
      <AnimatedModal isOpen={isOpen} onClose={handleClose} title="Suppression impossible">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertTriangle size={24} />
            <p className="font-semibold">
              Vous êtes le dernier administrateur. Vous ne pouvez pas supprimer votre compte.
            </p>
          </div>
          <p className="text-gray-600">
            Pour supprimer votre compte, vous devez d'abord promouvoir un autre utilisateur en administrateur.
          </p>
          <AnimatedButton onClick={handleClose} className="w-full">
            Compris
          </AnimatedButton>
        </div>
      </AnimatedModal>
    )
  }

  return (
    <AnimatedModal isOpen={isOpen} onClose={handleClose} title="Supprimer mon compte" size="md">
      {step === 1 ? (
        <div className="space-y-6">
          <div className="flex items-start space-x-3 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">⚠️ ATTENTION : Cette action est irréversible</p>
              <p className="text-sm text-gray-700">
                La suppression de votre compte entraînera la perte définitive de toutes vos données et accès.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pour confirmer, tapez exactement : <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={CONFIRMATION_TEXT}
            />
            {confirmationText && !canContinue && (
              <p className="text-sm text-red-600 mt-2">Le texte ne correspond pas exactement</p>
            )}
          </div>

          <div className="flex space-x-3">
            <AnimatedButton onClick={handleClose} variant="outline" className="flex-1">
              Annuler
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setStep(2)}
              disabled={!canContinue}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Continuer
            </AnimatedButton>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
            <p className="font-semibold text-yellow-800 mb-2">Vous allez perdre tous vos accès administrateur</p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Accès à toutes les fonctionnalités administratives</li>
              <li>Gestion des utilisateurs et contrôleurs</li>
              <li>Historique et statistiques</li>
              <li>Toutes vos données personnelles</li>
            </ul>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="understood"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="understood" className="text-sm text-gray-700">
              Je comprends que cette action est irréversible et que je vais perdre tous mes accès
            </label>
          </div>

          <div className="flex space-x-3">
            <AnimatedButton onClick={() => setStep(1)} variant="outline" className="flex-1">
              Retour
            </AnimatedButton>
            <AnimatedButton
              onClick={handleDelete}
              disabled={!canConfirm || deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-lg py-3"
            >
              {deleting ? 'Suppression...' : 'Confirmer la suppression'}
            </AnimatedButton>
          </div>
        </div>
      )}
    </AnimatedModal>
  )
}

