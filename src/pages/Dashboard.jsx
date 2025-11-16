import { useAuth } from '../context/AuthContext'
import { Users, DollarSign, CheckCircle, AlertCircle, FileText, Bell } from 'lucide-react'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import AnimatedButton from '../components/ui/AnimatedButton'
import PageTransition from '../components/ui/PageTransition'
import { useRealtimeStudents } from '../hooks/useRealtimeStudents'
import { useRealtimePayments } from '../hooks/useRealtimePayments'
import { useRealtimeScans } from '../hooks/useRealtimeScans'
import { useUserPresence } from '../hooks/useUserPresence'
import { CollaborativeNotificationManager } from '../components/ui/CollaborativeNotification'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, startTransition } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatDate } from '../lib/utils'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Précharger les pages critiques pour éviter les pages blanches
let StudentsPreloaded = false
let PaymentsPreloaded = false

const preloadStudents = async () => {
  if (StudentsPreloaded) return Promise.resolve()
  StudentsPreloaded = true
  try {
    await import('./Students')
  } catch (error) {
    StudentsPreloaded = false
    throw error
  }
}

const preloadPayments = async () => {
  if (PaymentsPreloaded) return Promise.resolve()
  PaymentsPreloaded = true
  try {
    await import('./Payments')
  } catch (error) {
    PaymentsPreloaded = false
    throw error
  }
}

// Précharger immédiatement au chargement du Dashboard
if (typeof window !== 'undefined') {
  // Précharger après un court délai pour ne pas bloquer le rendu initial
  setTimeout(() => {
    preloadStudents().catch(() => {
      // Erreur non bloquante
    })
    preloadPayments().catch(() => {
      // Erreur non bloquante
    })
  }, 500)
}

export default function Dashboard() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  
  // Hooks temps réel
  const { students, loading: studentsLoading } = useRealtimeStudents()
  const { payments, loading: paymentsLoading, stats: paymentStats } = useRealtimePayments()
  const { scans, loading: scansLoading, scanCount } = useRealtimeScans()
  useUserPresence() // Active le suivi de présence
  
  const [recentReminders, setRecentReminders] = useState([])
  const [loadingReminders, setLoadingReminders] = useState(true)
  const [scansByHour, setScansByHour] = useState([])
  const [paymentsData, setPaymentsData] = useState([])
  const [lineData, setLineData] = useState([])
  
  // Calculer les stats des étudiants
  const studentStats = {
    total: students?.length || 0,
    actifs: students?.filter(s => s.statut_paiement === 'ACTIF').length || 0,
    enRetard: students?.filter(s => s.statut_paiement === 'EN_RETARD').length || 0,
    expires: students?.filter(s => s.statut_paiement === 'EXPIRE').length || 0,
    horsService: students?.filter(s => s.statut_paiement === 'HORS_SERVICE').length || 0,
  }
  
  const stats = [
    {
      title: 'Total étudiants',
      value: studentStats.total,
      icon: Users,
      color: 'text-emsp-green',
      bgColor: 'bg-emsp-lightGreen/20',
    },
    {
      title: 'Actifs',
      value: studentStats.actifs,
      icon: CheckCircle,
      color: 'text-emsp-green',
      bgColor: 'bg-emsp-lightGreen/20',
    },
    {
      title: 'En retard',
      value: studentStats.enRetard,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Expirés',
      value: studentStats.expires,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Paiements ce mois',
      value: paymentStats?.thisMonth || 0,
      icon: DollarSign,
      color: 'text-emsp-yellow',
      bgColor: 'bg-yellow-100',
      isCurrency: true,
    },
    {
      title: 'Scans aujourd\'hui',
      value: scanCount || 0,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ]

  const handleQuickAction = async (action) => {
    switch (action) {
      case 'add-student':
        // Précharger AVANT de naviguer pour éviter page blanche
        await preloadStudents()
        // Attendre un peu pour que le composant soit chargé
        await new Promise(resolve => setTimeout(resolve, 100))
        // Utiliser sessionStorage comme fallback
        sessionStorage.setItem('openStudentForm', 'true')
        // Navigation avec startTransition
        startTransition(() => {
          navigate('/students', { state: { openForm: true } })
        })
        // Dispatcher l'événement après navigation
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-student-form'))
        }, 300)
        break
      case 'add-payment':
        // Précharger AVANT de naviguer pour éviter page blanche
        await preloadPayments()
        // Attendre un peu pour que le composant soit chargé
        await new Promise(resolve => setTimeout(resolve, 100))
        // Utiliser sessionStorage comme fallback
        sessionStorage.setItem('openPaymentForm', 'true')
        // Navigation avec startTransition
        startTransition(() => {
          navigate('/payments', { state: { openPayment: true } })
        })
        // Dispatcher l'événement après navigation
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-payment-form'))
        }, 300)
        break
      case 'generate-report':
        handleGenerateReport()
        break
      case 'scan-qr':
        // Précharger ScanQR avant navigation
        await import('./ScanQR')
        await new Promise(resolve => setTimeout(resolve, 100))
        startTransition(() => {
          navigate('/scan')
        })
        break
      default:
        break
    }
  }

  useEffect(() => {
    // Charger les données de manière progressive (non bloquant)
    // Attendre que les données principales soient chargées
    if (!studentsLoading && !paymentsLoading && !scansLoading) {
      // Charger les données supplémentaires après un court délai (non bloquant)
      setTimeout(() => {
        if (role === 'admin' || role === 'educator') {
          fetchRecentReminders()
        }
        loadTodayScans()
        loadPaymentsData()
        loadLineData()
      }, 100) // Petit délai pour permettre au Dashboard de s'afficher rapidement
    }
  }, [role, studentsLoading, paymentsLoading, scansLoading])

  // Charger les scans par heure (aujourd'hui)
  const loadTodayScans = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('scan_logs')
        .select('scanned_at, statut')
        .gte('scanned_at', today.toISOString())

      // Grouper par heure
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}h`,
        approved: 0,
        rejected: 0
      }))

      data?.forEach(scan => {
        const scanDate = new Date(scan.scanned_at)
        const hour = scanDate.getHours()
        if (scan.statut === 'approved') {
          hourlyData[hour].approved++
        } else {
          hourlyData[hour].rejected++
        }
      })

      setScansByHour(hourlyData)
    } catch (error) {
      logger.error('Erreur chargement scans par heure', error)
    }
  }

  // Charger les données de paiements (7 derniers jours)
  const loadPaymentsData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    const data = last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      const dayPayments = payments?.filter(p => 
        p.created_at?.startsWith(dateStr)
      ) || []
      
      return {
        date: formatDate(date, 'EEE d'), // Format français : "lun. 15"
        montant: dayPayments.reduce((sum, p) => sum + (p.montant_total || 0), 0) / 1000, // En milliers
        count: dayPayments.length
      }
    })

    setPaymentsData(data)
  }

  // Charger la répartition par ligne
  const loadLineData = () => {
    const lineStats = students?.reduce((acc, student) => {
      const lineName = student.lines?.nom || 'Sans ligne'
      const existing = acc.find(item => item.name === lineName)
      if (existing) {
        existing.value++
      } else {
        acc.push({ name: lineName, value: 1 })
      }
      return acc
    }, []) || []

    setLineData(lineStats)
  }

  const fetchRecentReminders = async () => {
    try {
      setLoadingReminders(true)
      const { data, error } = await supabase
        .from('reminders_history')
        .select(`
          *,
          sent_by_profile:sent_by (
            id,
            nom,
            email
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentReminders(data || [])
    } catch (error) {
      logger.error('Erreur récupération rappels récents', error)
    } finally {
      setLoadingReminders(false)
    }
  }

  const handleGenerateReport = async () => {
    try {
      const headers = ['Date', 'Étudiant', 'Montant (FCFA)', 'Nombre de mois']
      const rows = payments?.map(payment => [
        formatDate(payment.created_at, 'dd/MM/yyyy'), // Format français : "15/11/2026"
        `${payment.students?.nom || ''} ${payment.students?.prenom || ''}`,
        payment.montant_total || 0,
        payment.nombre_mois || 0,
      ]) || []
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `rapport-paiements-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Rapport généré avec succès')
    } catch (error) {
      logger.error('Erreur lors de la génération du rapport', error)
      toast.error('Erreur lors de la génération du rapport')
    }
  }

  return (
    <Layout>
      <CollaborativeNotificationManager />
      <PageTransition>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
              Tableau de bord EMSP
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {user?.email} ({role})
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6" data-tour="dashboard-stats">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <AnimatedCard key={index} delay={index * 0.1} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
                        {stat.isCurrency ? (
                          <AnimatedCounter
                            value={stat.value}
                            prefix=""
                            suffix=" FCFA"
                            decimals={0}
                          />
                        ) : (
                          <AnimatedCounter
                            value={stat.value}
                            prefix=""
                            suffix=""
                            decimals={0}
                          />
                        )}
                      </p>
                    </div>
                    <motion.div
                      className={`${stat.bgColor} ${stat.color} p-4 rounded-xl`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon size={28} />
                    </motion.div>
                  </div>
                </AnimatedCard>
              )
            })}
          </div>

          {/* Quick Actions */}
          <AnimatedCard delay={0.4} className="p-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent mb-6">
              Actions rapides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-tour="quick-actions">
              {(role === 'admin' || role === 'educator') && (
                <>
                  <AnimatedButton 
                    variant="primary" 
                    className="text-left p-4 h-full"
                    onClick={() => handleQuickAction('add-student')}
                    onMouseEnter={preloadStudents}
                    data-tour="add-student-btn"
                  >
                    Ajouter un étudiant
                  </AnimatedButton>
                  <AnimatedButton 
                    variant="secondary" 
                    className="text-left p-4 h-full"
                    onClick={() => handleQuickAction('add-payment')}
                    onMouseEnter={preloadPayments}
                    data-tour="add-payment-btn"
                  >
                    Enregistrer un paiement
                  </AnimatedButton>
                  <AnimatedButton 
                    variant="outline" 
                    className="text-left p-4 h-full"
                    onClick={() => handleQuickAction('generate-report')}
                  >
                    <FileText size={20} className="inline mr-2" />
                    Générer un rapport
                  </AnimatedButton>
                </>
              )}
              {role === 'controller' && (
                <AnimatedButton 
                  variant="primary" 
                  className="text-left p-4 h-full"
                  onClick={() => handleQuickAction('scan-qr')}
                >
                  Scanner un QR Code
                </AnimatedButton>
              )}
            </div>
          </AnimatedCard>

          {/* Graphiques */}
          {(role === 'admin' || role === 'educator') && (
            <>
              {/* Évolution paiements (7 derniers jours) */}
              <AnimatedCard delay={0.5} className="p-6">
                <h2 className="text-xl font-semibold text-emsp-green mb-4">
                  Évolution des paiements (7 derniers jours)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'montant') return `${value.toFixed(0)}k FCFA`
                        return value
                      }}
                    />
                    <Legend />
                    <Bar dataKey="montant" fill="#2D5016" name="Montant (k FCFA)" />
                    <Bar dataKey="count" fill="#FDB913" name="Nombre de paiements" />
                  </BarChart>
                </ResponsiveContainer>
              </AnimatedCard>

              {/* Répartition par ligne */}
              <AnimatedCard delay={0.6} className="p-6">
                <h2 className="text-xl font-semibold text-emsp-green mb-4">
                  Répartition par ligne
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={lineData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {lineData.map((entry, index) => {
                        const colors = ['#2D5016', '#7CB342', '#FDB913', '#FF6B35', '#4ECDC4', '#95E1D3']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </AnimatedCard>

              {/* Scans par heure (aujourd'hui) */}
              <AnimatedCard delay={0.7} className="p-6">
                <h2 className="text-xl font-semibold text-emsp-green mb-4">
                  Scans par heure (aujourd'hui)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scansByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approved" stackId="a" fill="#7CB342" name="Approuvés" />
                    <Bar dataKey="rejected" stackId="a" fill="#EF4444" name="Refusés" />
                  </BarChart>
                </ResponsiveContainer>
              </AnimatedCard>
            </>
          )}

          {/* Widget Rappels récents */}
          {(role === 'admin' || role === 'educator') && (
            <AnimatedCard delay={0.5} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-emsp-green flex items-center">
                  <Bell size={24} className="mr-2" />
                  Rappels récents
                </h2>
                <AnimatedButton
                  variant="outline"
                  onClick={() => navigate('/rappels')}
                  className="text-sm"
                >
                  Voir tout
                </AnimatedButton>
              </div>

              {loadingReminders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emsp-yellow mx-auto"></div>
                </div>
              ) : recentReminders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun rappel envoyé récemment</p>
              ) : (
                <div className="space-y-3">
                  {recentReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-emsp-green transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {reminder.recipients_count} rappel(s) envoyé(s) à {reminder.recipients_count} étudiant(s)
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {reminder.sent_by_profile?.nom || reminder.sent_by_profile?.email || 'Système'} •{' '}
                            {formatDistanceToNow(parseISO(reminder.sent_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          reminder.reminder_type === 'automatic'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {reminder.reminder_type === 'automatic' ? 'Automatique' : 'Manuel'}
                        </span>
                      </div>
                      {reminder.error_count > 0 && (
                        <p className="text-xs text-red-600 mt-2">
                          ⚠️ {reminder.error_count} erreur(s)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AnimatedCard>
          )}
        </div>
      </PageTransition>
    </Layout>
  )
}
