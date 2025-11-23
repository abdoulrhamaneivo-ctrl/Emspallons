import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Plus, DollarSign, Download, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import AnimatedBadge from '../components/ui/AnimatedBadge'
import PageTransition from '../components/ui/PageTransition'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import PaymentModal from '../components/payments/PaymentModal'
import SelectStudentModal from '../components/payments/SelectStudentModal'
import ReceiptPreviewModal from '../components/payments/ReceiptPreviewModal'
import { generateReceiptPDF, downloadReceipt } from '../services/receiptService'
import { formatDate } from '../lib/utils'
import logger from '../lib/logger'

export default function Payments() {
  const location = useLocation()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSelectStudent, setShowSelectStudent] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [selectedPaymentStudent, setSelectedPaymentStudent] = useState(null)

  // Déplacer fetchPayments avant useEffect pour éviter l'erreur TDZ
  const fetchPayments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students:student_id (
            id,
            nom,
            prenom,
            classe,
            niveau,
            ligne_id,
            lines:ligne_id (
              id,
              nom,
              couleur
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      logger.error('Erreur lors du chargement des paiements', error)
      toast.error('Erreur lors du chargement des paiements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Gérer l'ouverture du modal depuis le dashboard
  useEffect(() => {
    // Vérifier si on vient du dashboard avec openPayment ou sessionStorage
    const shouldOpen = location.state?.openPayment || sessionStorage.getItem('openPaymentForm')
    
    if (shouldOpen) {
      // Nettoyer sessionStorage
      sessionStorage.removeItem('openPaymentForm')
      // Attendre un peu pour que la page soit chargée
      setTimeout(() => {
        setShowSelectStudent(true)
      }, 300)
    }

    // Écouter l'événement custom
    const handleOpenPayment = () => {
      setShowSelectStudent(true)
    }
    window.addEventListener('open-payment-form', handleOpenPayment)

    return () => {
      window.removeEventListener('open-payment-form', handleOpenPayment)
    }
  }, [location.state])

  // Initialiser le cache avec useRef - utiliser une fonction pour éviter les erreurs TDZ
  const receiptCacheRef = useRef(null)
  
  // Fonction helper pour obtenir le cache Map
  const getCacheMap = useCallback(() => {
    if (!receiptCacheRef.current) {
      receiptCacheRef.current = new Map()
    }
    return receiptCacheRef.current
  }, [])

  // Déplacer toutes les fonctions avant leur utilisation pour éviter les erreurs TDZ
  const getReceiptFromCache = useCallback(async (payment, student) => {
    const cache = getCacheMap()
    const key = `${payment.id}-${student.id}`
    if (cache.has(key)) {
      return cache.get(key)
    }
    const doc = await generateReceiptPDF(payment, student)
    cache.set(key, doc)
    return doc
  }, [getCacheMap])

  const handleDownloadReceipt = useCallback(async (payment) => {
    try {
      // Récupérer l'étudiant depuis la relation students
      let student = payment.students
      
      // Si students n'existe pas ou est null, essayer de récupérer l'étudiant via student_id
      if (!student) {
        if (payment.student_id) {
          try {
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select(`
                id,
                nom,
                prenom,
                classe,
                niveau,
                ligne_id,
                lines:ligne_id (
                  id,
                  nom,
                  couleur
                )
              `)
              .eq('id', payment.student_id)
              .single()

            if (studentError) throw studentError
            student = studentData
          } catch (fetchError) {
            logger.error('Erreur lors de la récupération de l\'étudiant', fetchError)
            toast.error('Erreur lors de la récupération des données de l\'étudiant')
            return
          }
        } else {
        toast.error('Données étudiant introuvables')
          return
        }
      }

      // Vérifier que student est valide
      if (!student || !student.id) {
        toast.error('Données étudiant invalides')
        return
      }

      const doc = await getReceiptFromCache(payment, student)
      const studentName = `${student.nom} ${student.prenom || ''}`.trim()
      downloadReceipt(doc, studentName, payment.created_at || new Date().toISOString())
      toast.success('Reçu téléchargé')
    } catch (error) {
      logger.error('Erreur lors du téléchargement du reçu', error)
      toast.error('Erreur lors de la génération du reçu')
    }
  }, [getReceiptFromCache])

  const handlePreviewReceipt = useCallback(async (payment) => {
    try {
      // Récupérer l'étudiant depuis la relation students
      let student = payment.students
      
      // Si students n'existe pas ou est null, essayer de récupérer l'étudiant via student_id
      if (!student) {
        if (payment.student_id) {
          try {
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select(`
                id,
                nom,
                prenom,
                classe,
                niveau,
                ligne_id,
                lines:ligne_id (
                  id,
                  nom,
                  couleur
                )
              `)
              .eq('id', payment.student_id)
              .single()

            if (studentError) throw studentError
            student = studentData
          } catch (fetchError) {
            logger.error('Erreur lors de la récupération de l\'étudiant', fetchError)
            toast.error('Erreur lors de la récupération des données de l\'étudiant')
            return
          }
        } else {
        toast.error('Données étudiant introuvables')
          return
        }
      }

      // Vérifier que student est valide
      if (!student || !student.id) {
        toast.error('Données étudiant invalides')
        return
      }

      setSelectedPayment(payment)
      setSelectedPaymentStudent(student)
      setShowReceiptPreview(true)
    } catch (error) {
      logger.error('Erreur lors de l\'ouverture de la prévisualisation', error)
      toast.error('Erreur lors de l\'ouverture de la prévisualisation')
    }
  }, [])

  // Calculer totalAmount avec useMemo pour éviter les recalculs et problèmes TDZ
  const totalAmount = useMemo(() => {
    return payments.reduce((sum, payment) => sum + (payment.montant_total || 0), 0)
  }, [payments])

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0"
          >
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
                Paiements
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Gérez les paiements des étudiants
              </p>
            </div>
            <AnimatedButton 
              variant="primary" 
              className="flex items-center space-x-2 w-full sm:w-auto"
              onClick={() => setShowSelectStudent(true)}
              data-tour="add-payment-btn"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nouveau paiement</span>
              <span className="sm:hidden">Nouveau</span>
            </AnimatedButton>
          </motion.div>

          {/* Summary Card */}
          <AnimatedCard delay={0.1} className="bg-gradient-to-r from-emsp-green via-emsp-lightGreen to-emsp-green text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-2">Total ce mois</p>
                <p className="text-3xl font-bold">
                  <AnimatedCounter
                    value={totalAmount}
                    prefix=""
                    suffix=" FCFA"
                    decimals={0}
                  />
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <DollarSign size={48} className="opacity-80" />
              </motion.div>
            </div>
          </AnimatedCard>

          {/* Payments List */}
          <AnimatedCard delay={0.2} className="p-6" data-tour="payment-list">
            {loading ? (
              <LoadingSkeleton count={5} />
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-emsp-lightGreen hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-emsp-green text-base sm:text-lg truncate">
                          {payment.students?.nom || ''} {payment.students?.prenom || ''}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {formatDate(payment.created_at, 'd MMMM yyyy')}
                        </p>
                        {payment.nombre_mois && (
                          <p className="text-xs text-gray-500 mt-1">
                            {payment.nombre_mois} mois payé(s)
                          </p>
                        )}
                      </div>
                      <div className="w-full sm:w-auto text-left sm:text-right">
                        <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emsp-yellow to-emsp-green bg-clip-text text-transparent">
                          {Intl.NumberFormat('fr-FR').format(payment.montant_total || 0)} FCFA
                        </p>
                        <div className="mt-2 flex items-center sm:justify-end space-x-2 flex-wrap gap-2">
                          <AnimatedBadge
                            variant="success"
                          >
                            Payé
                          </AnimatedBadge>
                          <AnimatedButton
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewReceipt(payment)}
                            className="flex items-center space-x-1"
                            title="Prévisualiser le reçu"
                          >
                            <Eye size={16} />
                          </AnimatedButton>
                          <AnimatedButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment)}
                            className="flex items-center space-x-1"
                            title="Télécharger le reçu"
                          >
                            <Download size={16} />
                          </AnimatedButton>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatedCard>
        </div>

        {/* Modals */}
        <SelectStudentModal
          isOpen={showSelectStudent}
          onClose={() => setShowSelectStudent(false)}
          onSelect={(student) => {
            setSelectedStudent(student)
            setShowPaymentModal(true)
          }}
        />

        {selectedStudent && showPaymentModal && (
          <PaymentModal
            student={selectedStudent}
            onClose={() => {
              setShowPaymentModal(false)
              setSelectedStudent(null)
            }}
            onSuccess={() => {
              setShowPaymentModal(false)
              setSelectedStudent(null)
              fetchPayments()
            }}
          />
        )}

        {selectedPayment && selectedPaymentStudent && (
          <ReceiptPreviewModal
            isOpen={showReceiptPreview}
            onClose={() => {
              setShowReceiptPreview(false)
              setSelectedPayment(null)
              setSelectedPaymentStudent(null)
            }}
            payment={selectedPayment}
            student={selectedPaymentStudent}
          />
        )}
      </PageTransition>
    </Layout>
  )
}
