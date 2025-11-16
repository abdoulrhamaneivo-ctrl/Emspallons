import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { CACHE_KEYS, getCache, setCache } from '../lib/dataCache'
import logger from '../lib/logger'

const PAYMENTS_CACHE_TTL = 5 * 60 * 1000

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

  const updatePaymentsState = useCallback((updater) => {
    setPayments((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setCache(CACHE_KEYS.PAYMENTS, next, PAYMENTS_CACHE_TTL)
      return next
    })
  }, [])

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

  // Calculer les statistiques (la table payments n'a pas de colonne status)
  const calculateStats = useCallback((paymentsList) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))

    // Tous les paiements sont considérés comme "completed" (pas de statut dans la table)
    const thisMonth = paymentsList
      .filter((p) => {
        const paymentDate = new Date(p.created_at)
        return paymentDate >= startOfMonth
      })
      .reduce((sum, p) => sum + (p.montant_total || 0), 0)

    const today = paymentsList
      .filter((p) => {
        const paymentDate = new Date(p.created_at)
        return paymentDate >= startOfDay
      })
      .reduce((sum, p) => sum + (p.montant_total || 0), 0)

    const total = paymentsList
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

  // Chargement initial (optimisé : limite initiale)
  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true)
      // Limiter à 50 paiements récents initialement pour charger plus vite
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          student_id,
          montant_total,
          montant_mensuel,
          nombre_mois,
          date_debut,
          date_fin,
          created_at,
          students:student_id (
            id,
            nom,
            prenom
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50) // Limite initiale pour charger plus vite

      if (error) throw error
      updatePaymentsState(data || [])
      calculateStats(data || [])
      
      // Charger le reste en arrière-plan si nécessaire (non bloquant)
      const { count } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
      
      if (count && count > 50) {
        setTimeout(async () => {
          const { data: remainingData } = await supabase
            .from('payments')
            .select(`
              id,
              student_id,
              montant_total,
              montant_mensuel,
              nombre_mois,
              date_debut,
              date_fin,
              created_at,
              students:student_id (
                id,
                nom,
                prenom
              )
            `)
            .order('created_at', { ascending: false })
            .range(50, count - 1)
          
          if (remainingData) {
            updatePaymentsState((prev) => {
              const merged = [...prev, ...remainingData]
              calculateStats(merged)
              return merged
            })
          }
        }, 500) // Charger après 500ms
      }
    } catch (err) {
      logger.error('Erreur chargement paiements', err)
      toast.error('Erreur lors du chargement des paiements')
    } finally {
      setLoading(false)
    }
  }, [calculateStats, updatePaymentsState])

  useEffect(() => {
    const cached = getCache(CACHE_KEYS.PAYMENTS, PAYMENTS_CACHE_TTL)
    if (cached?.length) {
      updatePaymentsState(cached)
      calculateStats(cached)
      setLoading(false)
    }

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

          updatePaymentsState((prev) => {
            if (prev.find((p) => p.id === newPayment.id)) {
              return prev
            }
            const updated = [
              {
                ...newPayment,
                students: student,
              },
              ...prev,
            ]
            calculateStats(updated)
            return updated
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
          updatePaymentsState((prev) => {
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
          updatePaymentsState((prev) => {
            const filtered = prev.filter((p) => p.id !== payload.old.id)
            calculateStats(filtered)
            return filtered
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('✅ Abonnement temps réel paiements actif')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('❌ Erreur abonnement temps réel paiements', null, { status })
        }
      })

    return () => {
      subscription.unsubscribe()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [fetchInitial, calculateStats, debouncedNotification, updatePaymentsState])

  return { payments, loading, stats }
}

