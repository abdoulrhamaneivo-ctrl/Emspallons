import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { CACHE_KEYS, getCache, setCache } from '../lib/dataCache'
import logger from '../lib/logger'

const STUDENTS_CACHE_TTL = 5 * 60 * 1000

export function useRealtimeStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceTimerRef = useRef(null)
  const notificationQueueRef = useRef([])
  const isUserActiveRef = useRef(true)

  const updateStudentsState = useCallback((updater) => {
    setStudents((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setCache(CACHE_KEYS.STUDENTS, next, STUDENTS_CACHE_TTL)
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

  // Chargement initial (optimisé : limite initiale, chargement progressif)
  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true)
      // Limiter à 100 étudiants initialement pour charger plus vite
      // Les autres seront chargés progressivement si nécessaire
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          nom,
          prenom,
          classe,
          niveau,
          contact,
          statut_paiement,
          months_ledger,
          ligne_id,
          qr_code_token,
          qr_code_status,
          created_at,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100) // Limite initiale pour charger plus vite

      if (error) throw error
      updateStudentsState(data || [])
      
      // Si plus de 100 étudiants, charger le reste en arrière-plan (non bloquant)
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
      
      if (count && count > 100) {
        // Charger le reste progressivement
        setTimeout(async () => {
          const { data: remainingData } = await supabase
            .from('students')
            .select(`
              id,
              nom,
              prenom,
              classe,
              niveau,
              contact,
              statut_paiement,
              months_ledger,
              ligne_id,
              qr_code_token,
              qr_code_status,
              created_at,
              lines:ligne_id (
                id,
                nom,
                couleur
              )
            `)
            .order('created_at', { ascending: false })
            .range(100, count - 1)
          
          if (remainingData) {
            updateStudentsState(prev => [...prev, ...remainingData])
          }
        }, 500) // Charger après 500ms pour ne pas bloquer
      }
    } catch (err) {
      logger.error('Erreur chargement étudiants', err)
      toast.error('Erreur lors du chargement des étudiants')
    } finally {
      setLoading(false)
    }
  }, [updateStudentsState])

  useEffect(() => {
    const cached = getCache(CACHE_KEYS.STUDENTS, STUDENTS_CACHE_TTL)
    if (cached?.length) {
      updateStudentsState(cached)
      setLoading(false)
    }

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
            updateStudentsState((prev) => {
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
            updateStudentsState((prev) =>
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
          updateStudentsState((prev) => prev.filter((s) => s.id !== payload.old.id))
          debouncedNotification('warning', `Étudiant supprimé`)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('✅ Abonnement temps réel étudiants actif')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('❌ Erreur abonnement temps réel étudiants', null, { status })
        }
      })

    return () => {
      subscription.unsubscribe()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [fetchInitial, debouncedNotification, updateStudentsState])

  return { students, loading }
}

