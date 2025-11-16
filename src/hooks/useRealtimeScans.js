import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { CACHE_KEYS, getCache, setCache } from '../lib/dataCache'
import logger from '../lib/logger'

const SCANS_CACHE_TTL = 60 * 1000 // 1 minute

export function useRealtimeScans() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanCount, setScanCount] = useState(0)
  const debounceTimerRef = useRef(null)
  const notificationQueueRef = useRef([])
  const isUserActiveRef = useRef(true)

  const updateScansState = useCallback((updater) => {
    setScans((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setCache(CACHE_KEYS.SCANS, next, SCANS_CACHE_TTL)
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

  // Fonction pour traiter les notifications en batch
  const processNotificationQueue = useCallback(() => {
    if (notificationQueueRef.current.length === 0) return

    const notifications = [...notificationQueueRef.current]
    notificationQueueRef.current = []

    if (notifications.length > 5) {
      toast.success(`${notifications.length} nouveaux scans détectés`, {
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
        .from('scan_logs')
        .select(`
          *,
          students:student_id (
            id,
            nom,
            prenom,
            classe
          ),
          controllers:controller_id (
            id,
            nom
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(100)

      if (error) throw error
      updateScansState(data || [])
      setScanCount(data?.length || 0)
    } catch (err) {
      logger.error('Erreur chargement scans', err)
      toast.error('Erreur lors du chargement des scans')
    } finally {
      setLoading(false)
    }
  }, [updateScansState])

  useEffect(() => {
    const cached = getCache(CACHE_KEYS.SCANS, SCANS_CACHE_TTL)
    if (cached?.length) {
      updateScansState(cached)
      setScanCount(cached.length)
      setLoading(false)
    }

    fetchInitial()

    // Écoute des changements en temps réel
    const subscription = supabase
      .channel('scan_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scan_logs',
        },
        async (payload) => {
          const newScan = payload.new
          
          // Récupérer les données complètes de l'étudiant et du contrôleur
          const [studentData, controllerData] = await Promise.all([
            supabase
              .from('students')
              .select('nom, prenom, classe')
              .eq('id', newScan.student_id)
              .single(),
            newScan.controller_id
              ? supabase
                  .from('controllers')
                  .select('nom')
                  .eq('id', newScan.controller_id)
                  .single()
              : Promise.resolve({ data: null }),
          ])

          const student = studentData.data
          const controller = controllerData.data
          const studentName = student ? `${student.nom} ${student.prenom || ''}`.trim() : 'Étudiant'

          updateScansState((prev) => {
            if (prev.find(s => s.id === newScan.id)) {
              return prev
            }
            const updated = [
              {
                ...newScan,
                students: student,
                controllers: controller,
              },
              ...prev,
            ]
            setScanCount(updated.length)
            return updated
          })

          // Notification selon le statut
          const statusMessages = {
            approved: `✅ Scan approuvé : ${studentName}`,
            duplicate: `⚠️ Scan en doublon : ${studentName}`,
            expired: `❌ Scan expiré : ${studentName}`,
            wrong_line: `⚠️ Mauvaise ligne : ${studentName}`,
          }

          const message = statusMessages[newScan.statut] || `Nouveau scan : ${studentName}`
          debouncedNotification('success', message)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scan_logs',
        },
        (payload) => {
          updateScansState((prev) =>
            prev.map((s) => (s.id === payload.new.id ? payload.new : s))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'scan_logs',
        },
        (payload) => {
          updateScansState((prev) => {
            const filtered = prev.filter((s) => s.id !== payload.old.id)
            setScanCount(filtered.length)
            return filtered
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('✅ Abonnement temps réel scans actif')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('❌ Erreur abonnement temps réel scans', null, { status })
        }
      })

    return () => {
      subscription.unsubscribe()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [fetchInitial, debouncedNotification, updateScansState])

  return { scans, loading, scanCount }
}

