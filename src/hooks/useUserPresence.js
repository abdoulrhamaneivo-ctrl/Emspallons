import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import logger from '../lib/logger'

export function useUserPresence() {
  const { user } = useAuth()
  const heartbeatIntervalRef = useRef(null)

  // Mettre à jour la présence utilisateur
  const updatePresence = async () => {
    if (!user?.id) return

    try {
      // Utiliser la fonction RPC sécurisée pour éviter les problèmes RLS avec upsert
      const { error } = await supabase.rpc('upsert_user_presence', {
        p_user_id: user.id,
        p_is_online: true
      })

      if (error) {
        // Fallback : essayer upsert direct si la fonction RPC n'est pas disponible
        if (error.code === '42883' || error.message.includes('does not exist')) {
          logger.debug('Fonction RPC non disponible, utilisation upsert direct', error)
          const { error: upsertError } = await supabase
            .from('user_presence')
            .upsert(
              {
                user_id: user.id,
                last_seen: new Date().toISOString(),
                is_online: true,
              },
              {
                onConflict: 'user_id',
              }
            )
          
          if (upsertError) {
            logger.error('Erreur mise à jour présence (upsert direct)', upsertError)
          }
        } else {
          logger.error('Erreur mise à jour présence', error)
        }
      }
    } catch (err) {
      logger.error('Erreur présence', err)
    }
  }

  // Marquer comme hors ligne au démontage
  const markOffline = async () => {
    if (!user?.id) return

    try {
      await supabase
        .from('user_presence')
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    } catch (err) {
      logger.error('Erreur marquage hors ligne', err)
    }
  }

  useEffect(() => {
    if (!user?.id) return

    // Mise à jour initiale
    updatePresence()

    // Heartbeat toutes les 2 minutes
    heartbeatIntervalRef.current = setInterval(() => {
      updatePresence()
    }, 2 * 60 * 1000)

    // Marquer comme hors ligne quand la page se ferme
    const handleBeforeUnload = () => {
      markOffline()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Marquer comme hors ligne quand la visibilité change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Optionnel : marquer comme inactif après 5 minutes d'inactivité
      } else {
        updatePresence()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      markOffline()
    }
  }, [user?.id])

  return { updatePresence }
}

