import { useState, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Popup discrète d'aide qui apparaît après 30s d'inactivité
 */
export default function HelpPrompt() {
  const [show, setShow] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now())
      setShow(false)
    }

    // Écouter les événements d'activité
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Vérifier l'inactivité toutes les secondes
    const interval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity
      if (inactiveTime > 30000 && !show) { // 30 secondes
        setShow(true)
      }
    }, 1000)

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      clearInterval(interval)
    }
  }, [lastActivity, show])

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-white rounded-lg shadow-lg border-2 border-emsp-yellow p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HelpCircle className="text-emsp-yellow" size={20} />
                <p className="font-semibold text-gray-900">
                  Besoin d'aide ? 💡
                </p>
              </div>
              <button
                onClick={() => setShow(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Consultez notre centre d'aide pour des guides détaillés et des réponses à vos questions.
            </p>
            <Link
              to="/aide"
              onClick={() => setShow(false)}
              className="block w-full text-center px-4 py-2 bg-emsp-green text-white rounded-lg hover:bg-emsp-green/90 transition-colors text-sm font-medium"
            >
              Accéder à l'aide
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}



