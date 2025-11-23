import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import logger from '../../lib/logger'
import toast from 'react-hot-toast'
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import { Button } from '../ui'
import AnimatedModal from '../ui/AnimatedModal'

export default function ResetScansModal({ isOpen, onClose }) {
  const [isResetting, setIsResetting] = useState(false)
  const [scansCount, setScansCount] = useState(null)

  // Charger le nombre de scans de la dernière heure quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadScansCount()
    }
  }, [isOpen])

  const loadScansCount = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count, error } = await supabase
        .from('scan_logs')
        .select('*', { count: 'exact', head: true })
        .gte('scanned_at', oneHourAgo)

      if (error) {
        logger.error('Erreur chargement nombre de scans', error)
        return
      }

      setScansCount(count || 0)
    } catch (error) {
      logger.error('Erreur chargement scans', error)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    
    try {
      logger.info('Réinitialisation des scans de la dernière heure', {
        timestamp: new Date().toISOString()
      })

      // Calculer la date d'il y a 1 heure
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Récupérer le nombre de scans avant suppression
      const deletedCount = scansCount !== null ? scansCount : 0

      // Supprimer tous les scans de la dernière heure (pour tous les contrôleurs et tous les étudiants)
      const { error } = await supabase
        .from('scan_logs')
        .delete()
        .gte('scanned_at', oneHourAgo)

      if (error) {
        logger.error('Erreur réinitialisation scans', error)
        throw error
      }

      logger.info('Scans réinitialisés avec succès', {
        deleted_count: deletedCount,
        timestamp: new Date().toISOString()
      })

      toast.success(`Compteur d'heure réinitialisé avec succès. ${deletedCount} scan(s) supprimé(s). Tous les étudiants peuvent maintenant être scannés à nouveau.`, {
        duration: 5000
      })

      // Recharger le nombre de scans
      await loadScansCount()

      // Fermer le modal après 1 seconde
      setTimeout(() => {
        onClose()
      }, 1000)

    } catch (error) {
      logger.error('Erreur réinitialisation scans', error)
      toast.error('Erreur lors de la réinitialisation : ' + (error.message || 'Erreur inconnue'))
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Réinitialiser le Compteur d'Heure des Scans"
      size="lg"
    >
      <div className="space-y-6 p-6">
        {/* Explication */}
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Clock className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">
                Réinitialisation du Compteur d'Heure
              </h3>
              <p className="text-blue-600 mb-4">
                Cette action va <strong>supprimer tous les scans</strong> effectués dans la <strong>dernière heure</strong>.
              </p>
              <p className="text-blue-600 mb-4">
                Cela permettra de :
              </p>
              <ul className="space-y-1 text-blue-600 list-disc list-inside mb-4">
                <li>Réinitialiser le compteur de doublons pour <strong>tous les étudiants</strong></li>
                <li>Permettre de rescanner <strong>tous les étudiants</strong> immédiatement</li>
                <li>Remettre à zéro la fenêtre de 1 heure pour <strong>tous les contrôleurs</strong></li>
              </ul>
              {scansCount !== null && (
                <div className="bg-white rounded-lg p-3 border border-blue-300">
                  <p className="text-sm text-blue-700">
                    <strong>{scansCount}</strong> scan(s) de la dernière heure seront supprimés.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Avertissement */}
        <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                ⚠️ Cette action est <strong>irréversible</strong>. Les scans supprimés ne pourront pas être récupérés.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isResetting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleReset}
            disabled={isResetting}
            className="flex-1 bg-emsp-green hover:bg-emsp-lightGreen text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réinitialiser le compteur
              </>
            )}
          </Button>
        </div>
      </div>
    </AnimatedModal>
  )
}

