import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { Input } from '../ui'
import { hashPassword, generateSecurePassword } from '../../lib/controllerAuth'
import toast from 'react-hot-toast'

export default function ResetControllerPasswordModal({ isOpen, onClose, controller, onSuccess }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [useGenerated, setUseGenerated] = useState(true)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Générer un mot de passe au montage si useGenerated
  useEffect(() => {
    if (isOpen && useGenerated && !password) {
      setPassword(generateSecurePassword(12))
    }
  }, [isOpen, useGenerated])

  const handleGenerate = () => {
    setPassword(generateSecurePassword(12))
    setUseGenerated(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)
    try {
      // Hash le nouveau mot de passe
      const passwordHash = await hashPassword(password)

      // Mettre à jour le mot de passe
      const { error } = await supabase
        .from('controllers')
        .update({ password_hash: passwordHash })
        .eq('id', controller.id)

      if (error) throw error

      toast.success('Mot de passe modifié avec succès !')
      onSuccess()
      // Ouvrir WhatsApp si un numéro est disponible
      const phone = controller?.whatsapp
      if (phone) {
        const digits = phone.replace(/\D/g, '')
        const message = `Contrôleur EMSP\n\nCode: ${controller?.code}\nNouveau mot de passe: ${password}\nLigne: ${controller?.lines?.nom || 'N/A'}\n\nAccès: ${window.location.origin}/scan`
        const url = digits
          ? `https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(message)}`
          : `https://wa.me/?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
      } else {
        toast('Numéro WhatsApp non renseigné pour ce contrôleur', { icon: 'ℹ️' })
      }
      onClose()
      setPassword('')
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la modification du mot de passe')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setShowPassword(false)
    setUseGenerated(true)
    setCopied(false)
    onClose()
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Modifier le mot de passe - ${controller?.nom}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-emsp-green"
              name="passwordOption"
              value="generated"
              checked={useGenerated}
              onChange={() => {
                setUseGenerated(true)
                setPassword(generateSecurePassword(12))
              }}
            />
            <span className="ml-2 text-gray-700">Générer un mot de passe aléatoire</span>
          </label>
          <label className="inline-flex items-center ml-6">
            <input
              type="radio"
              className="form-radio text-emsp-green"
              name="passwordOption"
              value="manual"
              checked={!useGenerated}
              onChange={() => {
                setUseGenerated(false)
                setPassword('')
              }}
            />
            <span className="ml-2 text-gray-700">Saisir manuellement</span>
          </label>
        </div>

        {useGenerated ? (
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                readOnly
                placeholder="Mot de passe généré"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <AnimatedButton
              type="button"
              onClick={handleGenerate}
              variant="secondary"
              title="Générer un nouveau mot de passe"
            >
              <RefreshCw size={18} />
            </AnimatedButton>
            <AnimatedButton
              type="button"
              onClick={handleCopy}
              variant="outline"
              title="Copier le mot de passe"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </AnimatedButton>
          </div>
        ) : (
          <div className="relative">
            <Input
              label="Nouveau mot de passe (min 6 caractères)"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Saisir le nouveau mot de passe"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <AnimatedButton type="button" variant="outline" onClick={handleClose}>
            Annuler
          </AnimatedButton>
          <AnimatedButton type="submit" variant="primary" disabled={loading || !password}>
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  )
}

