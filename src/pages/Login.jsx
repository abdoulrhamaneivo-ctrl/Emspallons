import { useState, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import Logo from '../components/ui/Logo'
import AnimatedButton from '../components/ui/AnimatedButton'
import PageTransition from '../components/ui/PageTransition'
import { FloatingShapes, GradientOrb } from '../components/ui/DecorativeElements'
import RecentProfiles from '../components/auth/RecentProfiles'
import { Shield } from 'lucide-react'
import logger from '../lib/logger'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFullForm, setShowFullForm] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleControllerAccess = async (e) => {
    e.preventDefault()
    // Précharger ScanQR avant navigation pour éviter page blanche
    try {
      await import('./ScanQR')
      // Attendre un peu pour que le composant soit chargé
      await new Promise(resolve => setTimeout(resolve, 100))
      // Navigation avec startTransition
      startTransition(() => {
        navigate('/scan')
      })
    } catch (error) {
      logger.error('Erreur préchargement ScanQR', error)
      // Navigation de toute façon
      startTransition(() => {
        navigate('/scan')
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error

      // Afficher le toast et rediriger immédiatement (non bloquant)
      toast.success('Connexion réussie', { duration: 2000 })
      
      // Utiliser startTransition pour les lazy-loaded components (React 18)
      startTransition(() => {
        navigate('/dashboard')
      })
      
      // Note: Ne pas réinitialiser loading ici car on navigue
    } catch (error) {
      toast.error(error.message || 'Erreur de connexion')
      setLoading(false) // Réinitialiser seulement en cas d'erreur
    }
  }

  return (
    <Layout>
      <PageTransition>
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center relative">
          {/* Decorative elements */}
          <FloatingShapes />
          <GradientOrb position="top-right" size="large" />
          <GradientOrb position="bottom-left" size="medium" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="login-form bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-emsp-yellow/30 relative overflow-hidden z-10"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emsp-yellow/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emsp-lightGreen/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
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
                  EmspAllons
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mt-2"
                >
                  Connexion à votre espace
                </motion.p>
              </div>

              <RecentProfiles onUseOtherAccount={() => setShowFullForm(true)} />

              {showFullForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="form-group"
                >
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full px-4 py-3 border-2 border-emsp-yellow/30 rounded-xl focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emsp-lightGreen touch-manipulation"
                    placeholder="votre.email@emsp.com"
                    style={{ fontSize: '16px' }} // Évite le zoom automatique sur iOS
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="form-group"
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
                    inputMode="text"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full px-4 py-3 border-2 border-emsp-yellow/30 rounded-xl focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emsp-lightGreen touch-manipulation"
                    placeholder="••••••••"
                    style={{ fontSize: '16px' }} // Évite le zoom automatique sur iOS
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
              )}

              {/* Bouton Accès Contrôleur */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6"
              >
                <AnimatedButton
                  onClick={handleControllerAccess}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 bg-emsp-green hover:bg-emsp-lightGreen text-white border-emsp-green"
                >
                  <Shield size={18} />
                  <span>👮 Accès Contrôleur</span>
                </AnimatedButton>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    </Layout>
  )
}
