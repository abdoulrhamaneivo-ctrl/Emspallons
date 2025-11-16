import { useState, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginController } from '../../lib/controllerAuth'
import { FloatingShapes, GradientOrb } from '../ui/DecorativeElements'
import Logo from '../ui/Logo'
import AnimatedButton from '../ui/AnimatedButton'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ControllerLogin({ onLoginSuccess }) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const controllerData = await loginController(code, password)

      // Stocker la session immédiatement (non bloquant)
      sessionStorage.setItem('controller_session', JSON.stringify({
        controller_session: controllerData,
      }))

      // Afficher le toast et continuer immédiatement
      toast.success('Connexion réussie', { duration: 2000 })
      
      if (onLoginSuccess) {
        // Appeler le callback sans attendre
        onLoginSuccess(controllerData)
      } else {
        // Utiliser startTransition pour les lazy-loaded components (React 18)
        startTransition(() => {
          navigate('/scan')
        })
      }
      
      // Note: Ne pas réinitialiser loading ici car on navigue
    } catch (error) {
      toast.error(error.message || 'Erreur de connexion')
      setLoading(false) // Réinitialiser seulement en cas d'erreur
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emsp-green/5 relative overflow-hidden flex items-center justify-center">
      <FloatingShapes />
      <GradientOrb position="top-right" size="large" />
      <GradientOrb position="bottom-left" size="medium" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-emsp-yellow/30 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <Logo size="xl" showText={true} variant="transport" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent"
          >
            Accès Contrôleur
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mt-2"
          >
            Connectez-vous avec votre code et mot de passe
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Code contrôleur (XXXX-XXXX)
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                // Formatage automatique XXXX-XXXX
                if (value.length > 4 && !value.includes('-')) {
                  value = value.slice(0, 4) + '-' + value.slice(4, 8)
                }
                value = value.slice(0, 9) // Limiter à 9 caractères (XXXX-XXXX)
                setCode(value)
              }}
              required
              pattern="[A-Z0-9]{4}-[A-Z0-9]{4}"
              className="w-full px-4 py-3 border-2 border-emsp-yellow/30 rounded-xl focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emsp-lightGreen font-mono text-center text-lg"
              placeholder="ABCD-1234"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-emsp-yellow/30 rounded-xl focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emsp-lightGreen"
              placeholder="••••••••"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <AnimatedButton
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </AnimatedButton>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}

