/**
 * Composant pour afficher le statut réseau
 */

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowWarning(false)
      toast.success('Connexion rétablie', {
        icon: '✅',
        duration: 2000,
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowWarning(true)
      toast.error('Connexion perdue', {
        icon: '⚠️',
        duration: 4000,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg"
        >
          <WifiOff size={20} />
          <span className="text-sm font-medium">
            Vous êtes hors ligne. Vérifiez votre connexion internet.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

