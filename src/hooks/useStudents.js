import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { genererCodeQR } from '../lib/utils'

export const useStudents = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
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
      setStudents(data || [])
    } catch (err) {
      setError(err.message)
      toast.error('Erreur lors du chargement des étudiants')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()

    // Subscription en temps réel
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
          console.log('Change received!', payload)
          fetchStudents() // Recharger les données
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchStudents])

  const createStudent = async (studentData) => {
    try {
      // Générer le QR code token
      const qrToken = genererCodeQR()
      
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
      
      // Le trigger mettra à jour automatiquement le statut_paiement
      setStudents((prev) => [data, ...prev])
      toast.success('Étudiant créé avec succès')
      return { data, error: null }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création de l\'étudiant')
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
      setStudents((prev) =>
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
      setStudents((prev) => prev.filter((student) => student.id !== id))
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
