/**
 * Hook pour gérer le statut réseau et éviter les pages blanches
 */

import { useState, useEffect } from 'react'
import logger from '../lib/logger'

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      logger.info('Network status: online')
      setIsOnline(true)
      if (wasOffline) {
        // Recharger automatiquement si on était hors ligne
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
      setWasOffline(false)
    }

    const handleOffline = () => {
      logger.warn('Network status: offline')
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return { isOnline, wasOffline }
}

