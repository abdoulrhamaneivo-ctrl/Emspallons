import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import logger from '../../lib/logger'
import toast from 'react-hot-toast'
import { AlertTriangle, Shield, Trash2, Download, RefreshCw } from 'lucide-react'
import { Button } from '../ui'
import AnimatedModal from '../ui/AnimatedModal'

export default function ResetDatabaseModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState('')
  const [backupData, setBackupData] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)

  const CONFIRMATION_TEXT = 'RÉINITIALISER TOUT'

  // Étape 1 : Créer backup
  const createBackup = async () => {
    setIsCreatingBackup(true)
    try {
      logger.info('Création backup avant réinitialisation')
      
      const { data, error } = await supabase.rpc('create_backup_before_reset')
      
      if (error) {
        logger.error('Erreur lors de la création du backup', error)
        throw error
      }
      
      setBackupData(data)
      
      // Télécharger automatiquement le backup
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `emsp-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Backup créé et téléchargé avec succès')
      setStep(2)
      
    } catch (error) {
      logger.error('Erreur création backup', error)
      toast.error(error.message || 'Erreur lors de la création du backup')
    } finally {
      setIsCreatingBackup(false)
    }
  }

  // Étape 3 : Réinitialisation
  const performReset = async () => {
    if (confirmText !== CONFIRMATION_TEXT) {
      toast.error('Texte de confirmation incorrect')
      return
    }

    setIsResetting(true)
    try {
      logger.warn('🚨 RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES', null, {
        backup_created: !!backupData,
        timestamp: new Date().toISOString()
      })
      
      // Appel à la fonction de réinitialisation
      const { data, error } = await supabase.rpc('reset_database_except_admins')
      
      if (error) {
        logger.error('Erreur réinitialisation', error)
        throw error
      }
      
      logger.info('Réinitialisation terminée', data)
      
      // Log dans activity_logs (si la table existe et l'utilisateur est admin)
      try {
        const { data: user } = await supabase.auth.getUser()
        if (user?.user) {
          await supabase.from('activity_logs').insert({
            action_type: 'DATABASE_RESET',
            entity_type: 'SYSTEM',
            user_id: user.user.id,
            details: {
              deleted_counts: data,
              backup_created: !!backupData,
              timestamp: new Date().toISOString()
            }
          }).catch((logErr) => {
            // Si la table n'existe pas ou erreur, continuer quand même
            logger.debug('Impossible d\'enregistrer dans activity_logs', logErr)
          })
        }
      } catch (logError) {
        logger.debug('Erreur lors de l\'enregistrement du log', logError)
      }
      
      toast.success('Base de données réinitialisée avec succès', {
        duration: 5000
      })
      
      // Fermer le modal
      onClose()
      
      // Recharger la page après 2 secondes
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
      
    } catch (error) {
      logger.error('Erreur réinitialisation', error)
      toast.error(error.message || 'Erreur lors de la réinitialisation')
    } finally {
      setIsResetting(false)
    }
  }

  const handleClose = () => {
    if (!isResetting && !isCreatingBackup) {
      setStep(1)
      setConfirmText('')
      setBackupData(null)
      onClose()
    }
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="⚠️ Réinitialisation Complète"
      size="lg"
    >
      <div className="space-y-6 p-6">
        {/* Avertissement principal */}
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-700 mb-2">
                DANGER : Action Irréversible
              </h3>
              <p className="text-red-600 mb-4">
                Cette action va <strong>SUPPRIMER DÉFINITIVEMENT</strong> :
              </p>
              <ul className="space-y-1 text-red-600 list-disc list-inside">
                <li>Tous les étudiants</li>
                <li>Tous les paiements</li>
                <li>Tous les contrôleurs</li>
                <li>Tous les logs de scan</li>
                <li>Toutes les classes et niveaux</li>
                <li>Tous les historiques</li>
                <li>Tous les rappels et configurations</li>
              </ul>
              <p className="mt-4 text-red-700 font-semibold">
                ⚠️ Seuls les comptes administrateurs seront préservés
              </p>
            </div>
          </div>
        </div>

        {/* Étapes */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-gray-800">
              <Download className="w-5 h-5" />
              Étape 1 : Créer un backup de sécurité
            </h4>
            <p className="text-gray-600">
              Un fichier JSON contenant toutes les données actuelles sera téléchargé.
              Vous pourrez le conserver en cas de besoin.
            </p>
            <Button
              onClick={createBackup}
              disabled={isCreatingBackup}
              className="w-full bg-emsp-green hover:bg-emsp-lightGreen text-white"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Création du backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Créer et télécharger le backup
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Backup créé avec succès</span>
            </div>

            <h4 className="font-semibold flex items-center gap-2 text-gray-800">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Étape 2 : Confirmation finale
            </h4>
            
            <p className="text-gray-700">
              Pour confirmer la réinitialisation, tapez exactement :
            </p>
            
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
              <code className="text-red-600 font-bold text-lg">
                {CONFIRMATION_TEXT}
              </code>
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tapez le texte de confirmation ici"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              disabled={isResetting}
              autoComplete="off"
            />

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setStep(1)
                  setConfirmText('')
                }}
                variant="outline"
                className="flex-1"
                disabled={isResetting}
              >
                Retour
              </Button>
              <Button
                onClick={performReset}
                disabled={confirmText !== CONFIRMATION_TEXT || isResetting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Réinitialisation...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Réinitialiser tout
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Info backup */}
        {backupData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-medium">
              📦 Backup sauvegardé : {backupData.timestamp ? new Date(backupData.timestamp).toLocaleString('fr-FR') : 'Maintenant'}
            </p>
            {backupData.students_count !== undefined && (
              <p className="text-xs text-blue-600 mt-1">
                Données sauvegardées : {backupData.students_count} étudiants, {backupData.payments_count || 0} paiements, {backupData.controllers_count || 0} contrôleurs
              </p>
            )}
          </div>
        )}
      </div>
    </AnimatedModal>
  )
}

