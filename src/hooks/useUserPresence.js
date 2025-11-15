import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useUserPresence() {
  const { user } = useAuth()
  const heartbeatIntervalRef = useRef(null)

  // Mettre à jour la présence utilisateur
  const updatePresence = async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
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

      if (error) {
        console.error('Erreur mise à jour présence:', error)
      }
    } catch (err) {
      console.error('Erreur présence:', err)
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
      console.error('Erreur marquage hors ligne:', err)
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

