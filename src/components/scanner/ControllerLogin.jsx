import { useState, startTransition, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginController } from '../../lib/controllerAuth'
import { supabase } from '../../lib/supabase'
import logger from '../../lib/logger'
import { FloatingShapes, GradientOrb } from '../ui/DecorativeElements'
import Logo from '../ui/Logo'
import AnimatedButton from '../ui/AnimatedButton'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User } from 'lucide-react'
import ControllerProfile from './ControllerProfile'

export default function ControllerLogin({ onLoginSuccess }) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedControllerCode, setSelectedControllerCode] = useState('')
  const [recentControllers, setRecentControllers] = useState([])
  const navigate = useNavigate()

  // Charger les contrôleurs actifs récents pour accès rapide
  useEffect(() => {
    const fetchRecentControllers = async () => {
      try {
        const { data, error } = await supabase
          .from('controllers')
          .select(`
            id,
            nom,
            code,
            active,
            lines:ligne_id (
              id,
              nom,
              couleur
            )
          `)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          logger.debug('Error fetching recent controllers', error)
          return
        }

        setRecentControllers(data || [])
      } catch (error) {
        logger.debug('Error fetching recent controllers', error)
      }
    }

    fetchRecentControllers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const controllerData = await loginController(code, password)

      // Logger la connexion dans activity_logs
      try {
        const { error: activityError } = await supabase.from('activity_logs').insert([
          {
            action: 'controller_login',
            entity_type: 'controller',
            entity_id: controllerData.id,
            details: {
              controller_name: controllerData.name,
              controller_code: controllerData.code,
              ligne_id: controllerData.line_id,
              ligne_name: controllerData.line_name,
            },
          },
        ])

        if (activityError) {
          logger.debug('Error logging controller login', activityError)
          // Non bloquant
        }
      } catch (logError) {
        logger.debug('Error logging controller login', logError)
        // Non bloquant
      }

      // Stocker la session immédiatement (non bloquant)
      sessionStorage.setItem('controller_session', JSON.stringify({
        controller_session: controllerData,
      }))
      window.dispatchEvent(new CustomEvent('controller-session-changed', {
        detail: { controller: controllerData }
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

  const handleProfileClick = async (controllerCode) => {
    // Vérifier que le contrôleur existe et est actif
    try {
      const { data: controller, error } = await supabase
        .from('controllers')
        .select('id, nom, code, active')
        .eq('code', controllerCode)
        .eq('active', true)
        .maybeSingle()

      if (error || !controller) {
        toast.error('Code contrôleur invalide ou contrôleur inactif')
        return
      }

      setSelectedControllerCode(controllerCode)
      setShowProfileModal(true)
    } catch (error) {
      logger.error('Error checking controller', error)
      toast.error('Erreur lors de la vérification du contrôleur')
    }
  }

  const handleProfileLoginSuccess = (controllerData) => {
    setShowProfileModal(false)
    setCode('')
    setPassword('')
    
    if (onLoginSuccess) {
      onLoginSuccess(controllerData)
    } else {
      startTransition(() => {
        navigate('/scan')
      })
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
              inputMode="text"
              autoComplete="username"
              autoCapitalize="characters"
              autoCorrect="off"
              className="w-full px-4 py-3 border-2 border-emsp-yellow/30 rounded-xl focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emsp-lightGreen font-mono text-center text-lg text-base touch-manipulation"
              placeholder="ABCD-1234"
              style={{ fontSize: '16px' }} // Évite le zoom automatique sur iOS
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

        {/* Liste des contrôleurs récents pour accès rapide */}
        {recentControllers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-8 border-t border-gray-200"
          >
            <p className="text-sm font-medium text-gray-700 mb-4 text-center">
              Ou cliquez sur votre profil pour vous connecter
            </p>
            <div className="grid grid-cols-2 gap-3">
              {recentControllers.map((controller) => (
                <motion.button
                  key={controller.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProfileClick(controller.code)}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-emsp-green/10 rounded-xl border-2 border-transparent hover:border-emsp-green/30 transition-all text-left group"
                >
                  <div
                    className="w-10 h-10 rounded-full bg-emsp-green/20 flex items-center justify-center text-emsp-green font-bold group-hover:bg-emsp-green/30 transition-colors"
                    style={{
                      backgroundColor: controller.lines?.couleur ? `${controller.lines.couleur}20` : undefined,
                      color: controller.lines?.couleur || undefined,
                    }}
                  >
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {controller.nom}
                    </p>
                    <p className="text-xs text-gray-600 truncate font-mono">
                      {controller.code}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modal de profil pour authentification */}
      <ControllerProfile
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false)
          setSelectedControllerCode('')
        }}
        onLoginSuccess={handleProfileLoginSuccess}
        controllerCode={selectedControllerCode}
      />
    </div>
  )
}

