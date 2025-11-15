import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Edit } from 'lucide-react'
import logger from '../../lib/logger'

// Table pour suivre les éditions en cours
// Cette table doit être créée dans Supabase
// CREATE TABLE editing_locks (
//   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//   resource_type TEXT NOT NULL, -- 'student', 'payment', etc.
//   resource_id UUID NOT NULL,
//   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
//   started_at TIMESTAMPTZ DEFAULT NOW(),
//   UNIQUE(resource_type, resource_id)
// );

export function EditingIndicator({ resourceType, resourceId }) {
  const { user } = useAuth()
  const [editingUser, setEditingUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!resourceType || !resourceId) return

    // Charger l'état d'édition initial
    const loadEditingState = async () => {
      try {
        const { data, error } = await supabase
          .from('editing_locks')
          .select(`
            *,
            profiles:user_id (
              id,
              nom,
              email
            )
          `)
          .eq('resource_type', resourceType)
          .eq('resource_id', resourceId)
          .single()

        if (error && error.code !== 'PGRST116') {
          logger.error('Erreur chargement état édition', error, { resourceType, resourceId })
          return
        }

        if (data) {
          const profile = data.profiles
          // Ignorer si c'est l'utilisateur actuel
          if (data.user_id !== user?.id) {
            setEditingUser(profile)
            setIsEditing(true)
          }
        }
      } catch (err) {
        logger.error('Erreur état édition', err, { resourceType, resourceId })
      }
    }

    loadEditingState()

    // Écouter les changements en temps réel
    const subscription = supabase
      .channel(`editing_${resourceType}_${resourceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'editing_locks',
          filter: `resource_type=eq.${resourceType},resource_id=eq.${resourceId}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setEditingUser(null)
            setIsEditing(false)
          } else if (payload.new) {
            // Ignorer si c'est l'utilisateur actuel
            if (payload.new.user_id !== user?.id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('nom, email')
                .eq('id', payload.new.user_id)
                .single()

              if (profile) {
                setEditingUser(profile)
                setIsEditing(true)
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [resourceType, resourceId, user?.id])

  if (!isEditing || !editingUser) return null

  const userName = editingUser.nom || editingUser.email || 'Un utilisateur'

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
      <Edit className="h-4 w-4" />
      <span>
        ✏️ En cours de modification par <strong>{userName}</strong>
      </span>
    </div>
  )
}

// Hook pour gérer les verrous d'édition
export function useEditingLock(resourceType, resourceId) {
  const { user } = useAuth()
  const [isLocked, setIsLocked] = useState(false)

  // Acquérir un verrou d'édition
  const acquireLock = async () => {
    if (!user?.id || !resourceType || !resourceId) return false

    try {
      const { error } = await supabase.from('editing_locks').upsert(
        {
          resource_type: resourceType,
          resource_id: resourceId,
          user_id: user.id,
          started_at: new Date().toISOString(),
        },
        {
          onConflict: 'resource_type,resource_id',
        }
      )

      if (error) {
        // Si erreur, quelqu'un d'autre édite peut-être
        const { data } = await supabase
          .from('editing_locks')
          .select('user_id')
          .eq('resource_type', resourceType)
          .eq('resource_id', resourceId)
          .single()

        if (data && data.user_id !== user.id) {
          setIsLocked(true)
          return false
        }
        return false
      }

      setIsLocked(false)
      return true
    } catch (err) {
      logger.error('Erreur acquisition verrou', err, { resourceType, resourceId, userId: user?.id })
      return false
    }
  }

  // Libérer le verrou
  const releaseLock = async () => {
    if (!user?.id || !resourceType || !resourceId) return

    try {
      await supabase
        .from('editing_locks')
        .delete()
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .eq('user_id', user.id)

      setIsLocked(false)
    } catch (err) {
      logger.error('Erreur libération verrou', err, { resourceType, resourceId, userId: user?.id })
    }
  }

  // Nettoyer automatiquement les verrous expirés (> 10 minutes)
  useEffect(() => {
    const cleanup = async () => {
      try {
        await supabase
          .from('editing_locks')
          .delete()
          .lt('started_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      } catch (err) {
        logger.debug('Erreur nettoyage verrous (ignorée)', err)
      }
    }

    const interval = setInterval(cleanup, 5 * 60 * 1000) // Toutes les 5 minutes
    cleanup() // Nettoyer immédiatement

    return () => clearInterval(interval)
  }, [])

  // Libérer le verrou au démontage
  useEffect(() => {
    return () => {
      releaseLock()
    }
  }, [])

  return { acquireLock, releaseLock, isLocked }
}

