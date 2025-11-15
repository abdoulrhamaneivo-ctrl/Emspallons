import { useState } from 'react'
import { Copy, Check, RefreshCw, Mail } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Génère un mot de passe sécurisé
const generateSecurePassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '@#$%&*!'
  
  // Format : Xxxx9999@@@
  let password = ''
  
  // 1 majuscule
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  
  // 3 minuscules
  for (let i = 0; i < 3; i++) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
  }
  
  // 4 chiffres
  for (let i = 0; i < 4; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)]
  }
  
  // 3 symboles
  for (let i = 0; i < 3; i++) {
    password += symbols[Math.floor(Math.random() * symbols.length)]
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export default function ResetPasswordModal({ isOpen, onClose, user, onSuccess }) {
  const [password, setPassword] = useState('')
  const [useGenerated, setUseGenerated] = useState(true)
  const [sendEmail, setSendEmail] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Générer un mot de passe au montage si useGenerated
  useEffect(() => {
    if (isOpen && useGenerated && !password) {
      setPassword(generateSecurePassword())
    }
  }, [isOpen, useGenerated])

  const handleGenerate = () => {
    setPassword(generateSecurePassword())
    setUseGenerated(true)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast.success('Mot de passe copié dans le presse-papiers')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erreur lors de la copie')
    }
  }

  const handleReset = async () => {
    if (!password || password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    try {
      setResetting(true)

      // Appeler l'Edge Function pour réinitialiser le mot de passe
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          userId: user.id,
          newPassword: password,
          sendEmail: sendEmail,
        },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      // Logger dans activity_logs
      try {
        const { data: currentUser } = await supabase.auth.getUser()
        await supabase.from('activity_logs').insert([
          {
            user_id: currentUser?.user?.id,
            action: 'PASSWORD_RESET',
            description: `Réinitialisation du mot de passe pour ${user.nom} (${user.email})`,
            metadata: {
              reset_user_id: user.id,
              reset_user_email: user.email,
            },
          },
        ])
      } catch (logError) {
        console.warn('Error logging activity:', logError)
      }

      // Copier automatiquement le mot de passe
      await navigator.clipboard.writeText(password)
      toast.success('Mot de passe réinitialisé avec succès (copié dans le presse-papiers)', { duration: 5000 })
      
      onSuccess?.()
      onClose()
      setPassword('')
      setUseGenerated(true)
      setSendEmail(false)
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error.message || 'Erreur lors de la réinitialisation')
    } finally {
      setResetting(false)
    }
  }

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} title="Réinitialiser le mot de passe" size="md">
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold text-gray-700 mb-1">Utilisateur :</p>
          <p className="text-gray-600">{user.nom} ({user.email})</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              {useGenerated ? 'Mot de passe généré' : 'Nouveau mot de passe'}
            </label>
            {useGenerated && (
              <AnimatedButton
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <RefreshCw size={16} />
                <span>Régénérer</span>
              </AnimatedButton>
            )}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setUseGenerated(false)
              }}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow font-mono"
              placeholder="Générer ou saisir un mot de passe"
            />
            <AnimatedButton
              onClick={handleCopy}
              variant="outline"
              className="flex items-center space-x-2"
              title="Copier"
            >
              {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            </AnimatedButton>
          </div>

          {!useGenerated && (
            <div className="mt-2">
              <AnimatedButton
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <RefreshCw size={16} />
                <span>Générer un mot de passe aléatoire (recommandé)</span>
              </AnimatedButton>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Le mot de passe doit contenir au moins 8 caractères. Format recommandé : majuscules, minuscules, chiffres et symboles.
          </p>
        </div>

        <div className="flex items-start space-x-3 bg-blue-50 p-3 rounded-lg">
          <input
            type="checkbox"
            id="sendEmail"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="mt-1 w-5 h-5 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
          />
          <label htmlFor="sendEmail" className="text-sm text-gray-700 flex items-center space-x-2">
            <Mail size={16} />
            <span>Envoyer le nouveau mot de passe par email (si email configuré)</span>
          </label>
        </div>

        <div className="flex space-x-3">
          <AnimatedButton onClick={onClose} variant="outline" className="flex-1">
            Annuler
          </AnimatedButton>
          <AnimatedButton
            onClick={handleReset}
            disabled={!password || password.length < 8 || resetting}
            className="flex-1 bg-emsp-green hover:bg-emsp-lightGreen"
          >
            {resetting ? 'Réinitialisation...' : 'Réinitialiser'}
          </AnimatedButton>
        </div>
      </div>
    </AnimatedModal>
  )
}

