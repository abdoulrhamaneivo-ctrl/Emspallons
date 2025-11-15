import { useState } from 'react'
import { Check, X, Shield } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function PromoteAdminModal({ isOpen, onClose, user, onSuccess }) {
  const [promoting, setPromoting] = useState(false)

  const handlePromote = async () => {
    try {
      setPromoting(true)

      // Mettre à jour le rôle dans profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Logger dans activity_logs
      try {
        const { data: currentUser } = await supabase.auth.getUser()
        await supabase.from('activity_logs').insert([
          {
            user_id: currentUser?.user?.id,
            action: 'ADMIN_PROMOTE',
            description: `Promotion de ${user.nom} (${user.email}) en administrateur`,
            metadata: {
              promoted_user_id: user.id,
              promoted_user_email: user.email,
            },
          },
        ])
      } catch (logError) {
        console.warn('Error logging activity:', logError)
      }

      toast.success(`${user.nom} a été promu administrateur avec succès`)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error promoting user:', error)
      toast.error(error.message || 'Erreur lors de la promotion')
    } finally {
      setPromoting(false)
    }
  }

  const permissions = [
    'Créer/modifier/supprimer des utilisateurs',
    'Gérer les lignes et contrôleurs',
    'Modifier les paramètres globaux',
    'Voir l\'historique complet',
    'Réinitialiser les mots de passe',
  ]

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} title="Promouvoir en Administrateur" size="md">
      <div className="space-y-6">
        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
          <p className="font-semibold text-blue-800 mb-2">
            Vous allez donner les droits administrateur à <span className="font-bold">{user.nom}</span>
          </p>
          <p className="text-sm text-blue-700">
            Cette personne aura accès à toutes les fonctionnalités administratives de la plateforme.
          </p>
        </div>

        <div>
          <p className="font-semibold text-gray-700 mb-3">Permissions accordées :</p>
          <ul className="space-y-2">
            {permissions.map((permission, index) => (
              <li key={index} className="flex items-start space-x-2">
                <Check className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
                <span className="text-gray-700">{permission}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg">
          <Shield className="text-yellow-600" size={20} />
          <p className="text-sm text-yellow-800">
            Assurez-vous que cette personne est digne de confiance avant de confirmer.
          </p>
        </div>

        <div className="flex space-x-3">
          <AnimatedButton onClick={onClose} variant="outline" className="flex-1">
            Annuler
          </AnimatedButton>
          <AnimatedButton
            onClick={handlePromote}
            disabled={promoting}
            className="flex-1 bg-emsp-green hover:bg-emsp-lightGreen"
          >
            {promoting ? 'Promotion...' : 'Confirmer la promotion'}
          </AnimatedButton>
        </div>
      </div>
    </AnimatedModal>
  )
}

