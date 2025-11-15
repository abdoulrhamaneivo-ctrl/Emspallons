import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const usePayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPayments = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('payments')
        .select('*, students(nom, prenom, id)')
        .order('created_at', { ascending: false })

      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.startDate && filters.endDate) {
        query = query
          .gte('created_at', filters.startDate)
          .lte('created_at', filters.endDate)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setPayments(data || [])
    } catch (err) {
      setError(err.message)
      toast.error('Erreur lors du chargement des paiements')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    fetchPayments()
    
    // Abonnement temps réel pour synchronisation
    const subscription = supabase
      .channel('payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        () => {
          // Rafraîchir les paiements quand il y a un changement
          if (mounted) {
            fetchPayments()
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchPayments])

  const createPayment = async (paymentData) => {
    try {
      const { data, error: createError } = await supabase
        .from('payments')
        .insert([paymentData])
        .select('*, students(nom, prenom, id)')
        .single()

      if (createError) throw createError
      setPayments((prev) => [data, ...prev])
      toast.success('Paiement enregistré avec succès')
      return { data, error: null }
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement du paiement')
      return { data: null, error: err }
    }
  }

  const updatePayment = async (id, paymentData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', id)
        .select('*, students(nom, prenom, id)')
        .single()

      if (updateError) throw updateError
      setPayments((prev) =>
        prev.map((payment) => (payment.id === id ? data : payment))
      )
      toast.success('Paiement mis à jour avec succès')
      return { data, error: null }
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du paiement')
      return { data: null, error: err }
    }
  }

  const getTotalAmount = () => {
    return payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  return {
    payments,
    loading,
    error,
    fetchPayments,
    createPayment,
    updatePayment,
    getTotalAmount,
  }
}

