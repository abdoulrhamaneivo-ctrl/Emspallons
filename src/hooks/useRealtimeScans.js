import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useRealtimeScans() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanCount, setScanCount] = useState(0)
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
      setScans(data || [])
      setScanCount(data?.length || 0)
    } catch (err) {
      console.error('Erreur chargement scans:', err)
      toast.error('Erreur lors du chargement des scans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
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
          const controllerName = controller?.nom || 'Contrôleur'

          setScans((prev) => {
            if (prev.find(s => s.id === newScan.id)) {
              return prev
            }
            return [
              {
                ...newScan,
                students: student,
                controllers: controller,
              },
              ...prev,
            ]
          })
          setScanCount((prev) => prev + 1)

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
          setScans((prev) =>
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
          setScans((prev) => prev.filter((s) => s.id !== payload.old.id))
          setScanCount((prev) => Math.max(0, prev - 1))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Abonnement temps réel scans actif')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur abonnement temps réel scans')
        }
      })

    return () => {
      subscription.unsubscribe()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [fetchInitial, debouncedNotification])

  return { scans, loading, scanCount }
}

