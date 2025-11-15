import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import logger from '../../lib/logger'

export function OnlineBadge({ userId, showName = false }) {
  const [isOnline, setIsOnline] = useState(false)
  const [userName, setUserName] = useState('')
  const [lastSeen, setLastSeen] = useState(null)

  useEffect(() => {
    if (!userId) return

    // Charger la présence initiale
    const loadPresence = async () => {
      try {
        const { data, error } = await supabase
          .from('user_presence')
          .select('is_online, last_seen')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          logger.error('Erreur chargement présence', error, { userId })
          return
        }

        if (data) {
          setIsOnline(data.is_online)
          setLastSeen(data.last_seen)
        }

        // Charger le nom de l'utilisateur si nécessaire
        if (showName) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nom, email')
            .eq('id', userId)
            .single()

          if (profile) {
            setUserName(profile.nom || profile.email || 'Utilisateur')
          }
        }
      } catch (err) {
        logger.error('Erreur présence', err, { userId })
      }
    }

    loadPresence()

    // Écouter les changements en temps réel
    const subscription = supabase
      .channel(`presence_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setIsOnline(payload.new.is_online)
            setLastSeen(payload.new.last_seen)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, showName])

  if (!userId) return null

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        {isOnline && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>
      {showName && userName && (
        <span className="text-sm text-gray-600">{userName}</span>
      )}
      {!isOnline && lastSeen && (
        <span className="text-xs text-gray-400">
          Vu {new Date(lastSeen).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  )
}

// Composant pour afficher une liste d'utilisateurs avec leur statut en ligne
export function OnlineUsersList() {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOnlineUsers = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('user_presence')
          .select(`
            *,
            profiles:user_id (
              id,
              nom,
              email
            )
          `)
          .eq('is_online', true)
          .order('last_seen', { ascending: false })

        if (error) throw error

        setOnlineUsers(data || [])
      } catch (err) {
        logger.error('Erreur chargement utilisateurs en ligne', err)
      } finally {
        setLoading(false)
      }
    }

    loadOnlineUsers()

    // Écouter les changements en temps réel
    const subscription = supabase
      .channel('online_users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          loadOnlineUsers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Chargement des utilisateurs...</div>
    )
  }

  if (onlineUsers.length === 0) {
    return (
      <div className="text-sm text-gray-500">Aucun utilisateur en ligne</div>
    )
  }

  return (
    <div className="space-y-2">
      {onlineUsers.map((presence) => {
        const profile = presence.profiles
        const userName = profile?.nom || profile?.email || 'Utilisateur'
        return (
          <div key={presence.user_id} className="flex items-center gap-2">
            <OnlineBadge userId={presence.user_id} />
            <span className="text-sm text-gray-700">{userName}</span>
          </div>
        )
      })}
    </div>
  )
}

