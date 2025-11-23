import { useState } from 'react'
import { loginController } from '../../lib/controllerAuth'
import { supabase } from '../../lib/supabase'
import logger from '../../lib/logger'
import toast from 'react-hot-toast'
import { User, Lock, X } from 'lucide-react'
import { Button } from '../ui'
import AnimatedModal from '../ui/AnimatedModal'

export default function ControllerProfile({ isOpen, onClose, onLoginSuccess, controllerCode }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!password) {
      toast.error('Veuillez entrer votre mot de passe')
      return
    }

    setLoading(true)
    
    try {
      const controllerData = await loginController(controllerCode, password)

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

      // Stocker la session
      sessionStorage.setItem('controller_session', JSON.stringify({
        controller_session: controllerData,
      }))
      window.dispatchEvent(new CustomEvent('controller-session-changed', {
        detail: { controller: controllerData }
      }))

      toast.success('Connexion réussie', { duration: 2000 })
      
      // Réinitialiser le formulaire
      setPassword('')
      
      // Fermer le modal
      onClose()
      
      // Appeler le callback
      if (onLoginSuccess) {
        onLoginSuccess(controllerData)
      }
      
    } catch (error) {
      logger.error('Error controller login', error)
      toast.error(error.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    onClose()
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Authentification Contrôleur"
      size="md"
    >
      <div className="space-y-6 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emsp-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-emsp-green" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Code contrôleur : {controllerCode}
          </h3>
          <p className="text-sm text-gray-600">
            Entrez votre mot de passe pour accéder au scanner
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full pl-10 pr-4 py-3 border-2 border-emsp-yellow/30 rounded-xl focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emsp-lightGreen touch-manipulation"
                placeholder="••••••••"
                style={{ fontSize: '16px' }}
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !password}
              className="flex-1 bg-emsp-green hover:bg-emsp-lightGreen text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Lock className="w-4 h-4 mr-2 animate-pulse" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AnimatedModal>
  )
}

