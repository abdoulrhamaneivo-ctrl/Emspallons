import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useRealtimeStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceTimerRef = useRef(null)
  const notificationQueueRef = useRef([])
  const isUserActiveRef = useRef(true)

  // Vérifier si l'utilisateur est actif
  useEffect(() => {
    const handleActivity = () => {
      isUserActiveRef.current = true
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Vérifier l'inactivité toutes les 5 minutes
    const inactivityCheck = setInterval(() => {
      isUserActiveRef.current = false
    }, 5 * 60 * 1000)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearInterval(inactivityCheck)
    }
  }, [])

  // Fonction pour traiter les notifications en batch
  const processNotificationQueue = useCallback(() => {
    if (notificationQueueRef.current.length === 0) return

    const notifications = [...notificationQueueRef.current]
    notificationQueueRef.current = []

    if (notifications.length > 5) {
      // Si plus de 5 notifications, les regrouper
      toast.success(`${notifications.length} changements détectés`, {
        duration: 3000,
      })
    } else {
      // Afficher chaque notification
      notifications.forEach(notif => {
        if (isUserActiveRef.current) {
          toast[notif.type](notif.message, {
            duration: 3000,
          })
        }
      })
    }
  }, [])

  // Debounce pour éviter le spam
  const debouncedNotification = useCallback((type, message) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    notificationQueueRef.current.push({ type, message })

    debounceTimerRef.current = setTimeout(() => {
      processNotificationQueue()
    }, 500)
  }, [processNotificationQueue])

  // Chargement initial
  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error('Erreur chargement étudiants:', err)
      toast.error('Erreur lors du chargement des étudiants')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInitial()

    // Écoute des changements en temps réel
    const subscription = supabase
      .channel('students_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'students',
        },
        async (payload) => {
          const newStudent = payload.new
          
          // Récupérer les données complètes avec relations
          const { data: fullStudent } = await supabase
            .from('students')
            .select(`
              *,
              lines:ligne_id (
                id,
                nom,
                couleur
              )
            `)
            .eq('id', newStudent.id)
            .single()
          
          if (fullStudent) {
            setStudents((prev) => {
              // Vérifier si l'étudiant n'existe pas déjà
              if (prev.find(s => s.id === fullStudent.id)) {
                return prev
              }
              return [fullStudent, ...prev]
            })
            
            const studentName = fullStudent.nom || 'Étudiant'
            debouncedNotification('success', `Nouvel étudiant : ${studentName}`)
          }
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
          // Récupérer les données complètes avec relations
          const { data: fullStudent } = await supabase
            .from('students')
            .select(`
              *,
              lines:ligne_id (
                id,
                nom,
                couleur
              )
            `)
            .eq('id', payload.new.id)
            .single()
          
          if (fullStudent) {
            setStudents((prev) =>
              prev.map((s) => (s.id === fullStudent.id ? fullStudent : s))
            )
            
            const studentName = fullStudent.nom || 'Étudiant'
            debouncedNotification('info', `Étudiant modifié : ${studentName}`)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'students',
        },
        (payload) => {
          setStudents((prev) => prev.filter((s) => s.id !== payload.old.id))
          debouncedNotification('warning', `Étudiant supprimé`)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Abonnement temps réel étudiants actif')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur abonnement temps réel étudiants')
        }
      })

    return () => {
      subscription.unsubscribe()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [fetchInitial, debouncedNotification])

  return { students, loading }
}

