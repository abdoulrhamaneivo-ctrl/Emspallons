import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import logger from '../lib/logger'
import { CACHE_KEYS, getCache, setCache } from '../lib/dataCache'

const PAYMENTS_CACHE_TTL = 5 * 60 * 1000

export const usePayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const updatePaymentsState = useCallback((updater) => {
    setPayments((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setCache(CACHE_KEYS.PAYMENTS, next, PAYMENTS_CACHE_TTL)
      return next
    })
  }, [])

  const fetchPayments = useCallback(
    async ({ filters = {}, showLoader = true } = {}) => {
      try {
        if (showLoader && mountedRef.current) {
          setLoading(true)
        }
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
        if (mountedRef.current) {
          updatePaymentsState(data || [])
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message)
          toast.error('Erreur lors du chargement des paiements')
        }
        logger.error('Erreur lors du chargement des paiements', err)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [updatePaymentsState]
  )

  const loadPaymentWithRelations = useCallback(async (paymentId) => {
    if (!paymentId) return null
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, students(nom, prenom, id)')
        .eq('id', paymentId)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (err) {
      logger.warn('Impossible de recharger le paiement', { paymentId, error: err?.message })
      return null
    }
  }, [])

  const handleRealtimeChange = useCallback(
    async (payload) => {
      if (!payload || !mountedRef.current) return

      const { eventType, new: newPayment, old: oldPayment } = payload

      if (eventType === 'INSERT') {
        const hydrated = await loadPaymentWithRelations(newPayment?.id)
        if (hydrated) {
          updatePaymentsState((prev) => [hydrated, ...prev])
        } else {
          fetchPayments({ showLoader: false })
        }
      } else if (eventType === 'UPDATE') {
        const hydrated = await loadPaymentWithRelations(newPayment?.id)
        if (hydrated) {
          updatePaymentsState((prev) =>
            prev.map((payment) => (payment.id === hydrated.id ? hydrated : payment))
          )
        } else {
          fetchPayments({ showLoader: false })
        }
      } else if (eventType === 'DELETE' && oldPayment?.id) {
        updatePaymentsState((prev) => prev.filter((payment) => payment.id !== oldPayment.id))
      }
    },
    [fetchPayments, loadPaymentWithRelations, updatePaymentsState]
  )

  useEffect(() => {
    mountedRef.current = true

    const cached = getCache(CACHE_KEYS.PAYMENTS, PAYMENTS_CACHE_TTL)
    if (cached?.length) {
      setPayments(cached)
      setLoading(false)
    }

    fetchPayments({ showLoader: !(cached?.length) })
    
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
        (payload) => {
          handleRealtimeChange(payload)
        }
      )
      .subscribe()

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [fetchPayments, handleRealtimeChange])

  const createPayment = async (paymentData) => {
    try {
      const { data, error: createError } = await supabase
        .from('payments')
        .insert([paymentData])
        .select('*, students(nom, prenom, id)')
        .single()

      if (createError) throw createError
      updatePaymentsState((prev) => [data, ...prev])
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
      updatePaymentsState((prev) =>
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

