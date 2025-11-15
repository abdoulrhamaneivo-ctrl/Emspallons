import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useRealtimePayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    today: 0,
  })
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

  // Calculer les statistiques
  const calculateStats = useCallback((paymentsList) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))

    const thisMonth = paymentsList
      .filter((p) => {
        const paymentDate = new Date(p.created_at)
        return paymentDate >= startOfMonth && p.status === 'completed'
      })
      .reduce((sum, p) => sum + (p.montant_total || 0), 0)

    const today = paymentsList
      .filter((p) => {
        const paymentDate = new Date(p.created_at)
        return paymentDate >= startOfDay && p.status === 'completed'
      })
      .reduce((sum, p) => sum + (p.montant_total || 0), 0)

    const total = paymentsList
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.montant_total || 0), 0)

    setStats({
      total,
      thisMonth,
      today,
    })
  }, [])

  // Fonction pour traiter les notifications en batch
  const processNotificationQueue = useCallback(() => {
    if (notificationQueueRef.current.length === 0) return

    const notifications = [...notificationQueueRef.current]
    notificationQueueRef.current = []

    if (notifications.length > 5) {
      toast.success(`${notifications.length} nouveaux paiements détectés`, {
        duration: 3000,
      })
    } else {
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
        .from('payments')
        .select('*, students(nom, prenom, id)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
      calculateStats(data || [])
    } catch (err) {
      console.error('Erreur chargement paiements:', err)
      toast.error('Erreur lors du chargement des paiements')
    } finally {
      setLoading(false)
    }
  }, [calculateStats])

  useEffect(() => {
    fetchInitial()

    // Écoute des changements en temps réel
    const subscription = supabase
      .channel('payments_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
        },
        async (payload) => {
          const newPayment = payload.new

          // Récupérer les données complètes de l'étudiant
          const { data: studentData } = await supabase
            .from('students')
            .select('nom, prenom')
            .eq('id', newPayment.student_id)
            .single()

          const student = studentData
          const studentName = student
            ? `${student.nom} ${student.prenom || ''}`.trim()
            : 'Étudiant'

          setPayments((prev) => {
            if (prev.find((p) => p.id === newPayment.id)) {
              return prev
            }
            return [
              {
                ...newPayment,
                students: student,
              },
              ...prev,
            ]
          })

          // Recalculer les stats
          setPayments((prev) => {
            calculateStats(prev)
            return prev
          })

          const amount = newPayment.montant_total || 0
          debouncedNotification(
            'success',
            `💰 Nouveau paiement : ${studentName} - ${amount.toLocaleString('fr-FR')} FCFA`
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          setPayments((prev) => {
            const updated = prev.map((p) =>
              p.id === payload.new.id ? payload.new : p
            )
            calculateStats(updated)
            return updated
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          setPayments((prev) => {
            const filtered = prev.filter((p) => p.id !== payload.old.id)
            calculateStats(filtered)
            return filtered
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Abonnement temps réel paiements actif')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur abonnement temps réel paiements')
        }
      })

    return () => {
      subscription.unsubscribe()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [fetchInitial, calculateStats, debouncedNotification])

  return { payments, loading, stats }
}

