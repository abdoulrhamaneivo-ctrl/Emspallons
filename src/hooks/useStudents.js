import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { genererCodeQR } from '../lib/utils'
import logger from '../lib/logger'
import { CACHE_KEYS, getCache, setCache } from '../lib/dataCache'

const STUDENTS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const useStudents = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const linesCacheRef = useRef(new Map())
  const mountedRef = useRef(true)

  const updateStudentsState = useCallback((updater) => {
    setStudents((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setCache(CACHE_KEYS.STUDENTS, next, STUDENTS_CACHE_TTL)
      return next
    })
  }, [])

  const enrichStudentWithLine = useCallback(
    async (student) => {
      if (!student) return student
      if (student.lines) return student
      if (!student.ligne_id) {
        return { ...student, lines: null }
      }

      const cachedLine = linesCacheRef.current.get(student.ligne_id)
      if (cachedLine) {
        return { ...student, lines: cachedLine }
      }

      try {
        const { data, error: lineError } = await supabase
          .from('lines')
          .select('id, nom, couleur')
          .eq('id', student.ligne_id)
          .maybeSingle()

        if (lineError) throw lineError
        if (data) {
          linesCacheRef.current.set(student.ligne_id, data)
          return { ...student, lines: data }
        }
      } catch (err) {
        logger.warn('Impossible de récupérer la ligne associée', {
          studentId: student.id,
          ligneId: student.ligne_id,
          error: err?.message,
        })
      }

      return { ...student, lines: null }
    },
    []
  )

  const fetchStudents = useCallback(
    async ({ showLoader = true } = {}) => {
      try {
        if (showLoader && mountedRef.current) {
          setLoading(true)
        }
        setError(null)
        const { data, error: fetchError } = await supabase
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

        if (fetchError) throw fetchError
        if (mountedRef.current) {
          updateStudentsState(data || [])
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message)
          toast.error('Erreur lors du chargement des étudiants')
        }
        logger.error('Erreur lors du chargement des étudiants', err)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [updateStudentsState]
  )

  const handleRealtimeChange = useCallback(
    async (payload) => {
      if (!payload || !mountedRef.current) return

      const { eventType, new: newStudent, old: oldStudent } = payload

      try {
        if (eventType === 'INSERT') {
          const enriched = await enrichStudentWithLine(newStudent)
          updateStudentsState((prev) => {
            if (prev.some((student) => student.id === enriched.id)) {
              return prev.map((student) => (student.id === enriched.id ? enriched : student))
            }
            return [enriched, ...prev]
          })
        } else if (eventType === 'UPDATE') {
            const enriched = await enrichStudentWithLine(newStudent)
            updateStudentsState((prev) =>
            prev.map((student) => (student.id === enriched.id ? enriched : student))
          )
        } else if (eventType === 'DELETE' && oldStudent?.id) {
            updateStudentsState((prev) => prev.filter((student) => student.id !== oldStudent.id))
        }
      } catch (err) {
        logger.error('Erreur lors du traitement temps réel des étudiants', err)
      }
    },
    [enrichStudentWithLine, updateStudentsState]
  )

  useEffect(() => {
    mountedRef.current = true

      const cached = getCache(CACHE_KEYS.STUDENTS, STUDENTS_CACHE_TTL)
      if (cached?.length) {
        updateStudentsState(cached)
        setLoading(false)
      }

    fetchStudents({ showLoader: !(cached?.length) })

    const subscription = supabase
      .channel('students_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        (payload) => {
          handleRealtimeChange(payload)
        }
      )
      .subscribe()

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
    }, [fetchStudents, handleRealtimeChange, updateStudentsState])

  const createStudent = async (studentData, options = {}) => {
    const { silent = false } = options
    try {
      const qrToken = studentData.qr_code_token || genererCodeQR()
      
      const dataToInsert = {
        ...studentData,
        qr_code_token: qrToken,
        qr_code_status: 'active',
        months_ledger: [],
      }

      const { data, error: createError } = await supabase
        .from('students')
        .insert([dataToInsert])
        .select(`
          *,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .single()

      if (createError) throw createError
      
      updateStudentsState((prev) => [data, ...prev])
      if (!silent) {
        toast.success('Étudiant créé avec succès')
      }
      return { data, error: null }
    } catch (err) {
      if (!silent) {
        toast.error(err.message || 'Erreur lors de la création de l\'étudiant')
      }
      return { data: null, error: err }
    }
  }

  const updateStudent = async (id, studentData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', id)
        .select(`
          *,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .single()

      if (updateError) throw updateError
      updateStudentsState((prev) =>
        prev.map((student) => (student.id === id ? data : student))
      )
      toast.success('Étudiant mis à jour avec succès')
      return { data, error: null }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour de l\'étudiant')
      return { data: null, error: err }
    }
  }

  const deleteStudent = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      updateStudentsState((prev) => prev.filter((student) => student.id !== id))
      toast.success('Étudiant supprimé avec succès')
      return { error: null }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression de l\'étudiant')
      return { error: err }
    }
  }

  const regenerateQRCode = async (id) => {
    try {
      const newToken = genererCodeQR()
      const { data, error } = await updateStudent(id, {
        qr_code_token: newToken,
        qr_code_status: 'active',
      })
      
      if (error) throw error
      
      toast.success('QR Code régénéré avec succès')
      
      // Télécharger automatiquement le nouveau QR code
      try {
        // Récupérer les données complètes de l'étudiant
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single()

        if (studentData) {
          // Mettre à jour le token dans studentData avec le nouveau token
          studentData.qr_code_token = newToken
          
          // Petit délai pour laisser le toast s'afficher
          setTimeout(async () => {
            try {
              const { downloadQRCodeFromToken } = await import('../utils/qrDownload')
              await downloadQRCodeFromToken(studentData)
              toast.success('QR Code téléchargé automatiquement')
            } catch (qrError) {
              logger.error('Erreur lors du téléchargement automatique du QR code', qrError, { studentId: id })
              toast.error('QR Code régénéré mais non téléchargé automatiquement')
            }
          }, 500)
        }
      } catch (downloadError) {
        logger.error('Erreur lors du téléchargement automatique du QR code', downloadError, { studentId: id })
        // Ne pas bloquer la régénération si le téléchargement échoue
      }

      return { data, error: null }
    } catch (err) {
      toast.error('Erreur lors de la régénération du QR Code')
      return { data: null, error: err }
    }
  }

  const revokeQRCode = async (id) => {
    try {
      const { data, error } = await updateStudent(id, {
        qr_code_status: 'revoked',
      })
      
      if (error) throw error
      toast.success('QR Code révoqué avec succès')
      return { data, error: null }
    } catch (err) {
      toast.error('Erreur lors de la révocation du QR Code')
      return { data: null, error: err }
    }
  }

  // Statistiques calculées
  const stats = {
    total: students.length,
    actifs: students.filter((s) => s.statut_paiement === 'ACTIF').length,
    enRetard: students.filter((s) => s.statut_paiement === 'EN_RETARD').length,
    expires: students.filter((s) => s.statut_paiement === 'EXPIRE').length,
    horsService: students.filter((s) => s.statut_paiement === 'HORS_SERVICE').length,
  }

  return {
    students,
    loading,
    error,
    stats,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    regenerateQRCode,
    revokeQRCode,
  }
}
