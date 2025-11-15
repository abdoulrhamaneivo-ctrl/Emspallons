import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import AnimatedModal from '../ui/AnimatedModal'
import { Input } from '../ui'
import AnimatedButton from '../ui/AnimatedButton'
import toast from 'react-hot-toast'

export default function QuickLoginModal({ isOpen, onClose, profile, onSuccess }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Le mot de passe est requis')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: signInError } = await signIn(profile.email, password)
      if (signInError) throw signInError

      toast.success(`Bienvenue, ${profile.name} !`)
      onSuccess()
      navigate('/dashboard')
    } catch (error) {
      setError(error.message || 'Mot de passe incorrect')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Connexion rapide"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        <Input
          label="Mot de passe *"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          error={error}
          required
          placeholder="Entrez votre mot de passe"
          autoFocus
        />

        <div className="flex gap-3 pt-4">
          <AnimatedButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  )
}

