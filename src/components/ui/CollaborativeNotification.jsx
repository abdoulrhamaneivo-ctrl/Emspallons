import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { User, X } from 'lucide-react'

// Composant pour afficher les notifications collaboratives
export function CollaborativeNotificationManager() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const maxNotifications = 3

  useEffect(() => {
    if (!user?.id) return

    // Écouter les changements sur students pour détecter les actions d'autres utilisateurs
    const studentsChannel = supabase
      .channel('collaborative_students')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'students',
        },
        async (payload) => {
          // Ignorer ses propres actions
          if (payload.new.created_by === user.id) return

          // Récupérer le profil de l'utilisateur qui a fait l'action
          const { data: profile } = await supabase
            .from('profiles')
            .select('nom, email')
            .eq('id', payload.new.created_by)
            .single()

          const userName = profile?.nom || profile?.email || 'Un utilisateur'
          const studentName = payload.new.nom || 'Étudiant'

          addNotification({
            id: `student-insert-${payload.new.id}`,
            type: 'success',
            message: `${userName} a ajouté un étudiant`,
            detail: studentName,
            action: 'Voir',
            onAction: () => navigate(`/students?highlight=${payload.new.id}`),
            studentId: payload.new.id,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
        },
        async (payload) => {
          if (payload.new.updated_by === user.id) return

          const { data: profile } = await supabase
            .from('profiles')
            .select('nom, email')
            .eq('id', payload.new.updated_by)
            .single()

          const userName = profile?.nom || profile?.email || 'Un utilisateur'
          const studentName = payload.new.nom || 'Étudiant'

          addNotification({
            id: `student-update-${payload.new.id}`,
            type: 'info',
            message: `${userName} a modifié un étudiant`,
            detail: studentName,
            action: 'Voir',
            onAction: () => navigate(`/students?highlight=${payload.new.id}`),
            studentId: payload.new.id,
          })
        }
      )
      .subscribe()

    // Écouter les changements sur payments
    const paymentsChannel = supabase
      .channel('collaborative_payments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
        },
        async (payload) => {
          if (payload.new.created_by === user.id) return

          const { data: profile } = await supabase
            .from('profiles')
            .select('nom, email')
            .eq('id', payload.new.created_by)
            .single()

          const userName = profile?.nom || profile?.email || 'Un utilisateur'

          addNotification({
            id: `payment-insert-${payload.new.id}`,
            type: 'success',
            message: `${userName} a enregistré un paiement`,
            detail: `${payload.new.montant_total || 0} FCFA`,
            action: 'Voir',
            onAction: () => navigate('/payments'),
          })
        }
      )
      .subscribe()

    return () => {
      studentsChannel.unsubscribe()
      paymentsChannel.unsubscribe()
    }
  }, [user?.id, navigate])

  const addNotification = (notification) => {
    setNotifications((prev) => {
      // Éviter les doublons
      if (prev.find((n) => n.id === notification.id)) {
        return prev
      }

      const newNotifications = [notification, ...prev].slice(0, maxNotifications)

      // Afficher la notification toast
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <User className="h-6 w-6 text-emsp-green" />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </p>
                  {notification.detail && (
                    <p className="mt-1 text-sm text-gray-500">
                      {notification.detail}
                    </p>
                  )}
                  {notification.action && (
                    <button
                      onClick={() => {
                        notification.onAction?.()
                        toast.dismiss(t.id)
                      }}
                      className="mt-2 text-sm font-medium text-emsp-green hover:text-emsp-lightGreen"
                    >
                      {notification.action} →
                    </button>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emsp-yellow"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: 5000,
          position: 'top-right',
        }
      )

      return newNotifications
    })
  }

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Auto-supprimer les notifications après 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => {
        // Garder seulement les 3 plus récentes
        return prev.slice(0, maxNotifications)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return null // Ce composant gère les notifications via toast, pas de rendu direct
}

// Hook pour utiliser les notifications collaboratives
export function useCollaborativeNotifications() {
  return {}
}

