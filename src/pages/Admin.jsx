import { Link } from 'react-router-dom'
import { useState } from 'react'
import Layout from '../components/Layout'
import { Users, Settings, BarChart3, UserCheck, History, Route, DollarSign, AlertTriangle, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedCard from '../components/ui/AnimatedCard'
import PageTransition from '../components/ui/PageTransition'
import { useAuth } from '../context/AuthContext'
import ResetDatabaseModal from '../components/admin/ResetDatabaseModal'

export default function Admin() {
  const { isAdmin, role } = useAuth()
  const [showResetModal, setShowResetModal] = useState(false)
  
  const adminSections = [
    {
      title: 'Gestion des utilisateurs',
      description: 'Créer et gérer les comptes éducateurs',
      icon: Users,
      color: 'bg-emsp-green',
      path: '/admin/users',
    },
    {
      title: 'Gestion des contrôleurs',
      description: 'Créer et gérer les contrôleurs de bus',
      icon: UserCheck,
      color: 'bg-emsp-lightGreen',
      path: '/admin/controllers',
    },
    {
      title: 'Gestion des classes',
      description: 'Créer et modifier les classes disponibles',
      icon: Settings,
      color: 'bg-emsp-yellow',
      path: '/admin/classes',
    },
    ...(isAdmin ? [{
      title: 'Gestion des niveaux',
      description: 'Créer et modifier les niveaux disponibles',
      icon: BarChart3,
      color: 'bg-emsp-green',
      path: '/admin/niveaux',
    }] : []),
    {
      title: 'Historique des scans',
      description: 'Consulter l\'historique complet des scans QR',
      icon: History,
      color: 'bg-emsp-lightGreen',
      path: '/admin/scan-history',
    },
    ...(isAdmin ? [
      {
        title: 'Historique des activités',
        description: 'Traçabilité complète de toutes les actions sur la plateforme',
        icon: History,
        color: 'bg-emsp-yellow',
        path: '/admin/activity-logs',
      },
      {
        title: 'Gestion des lignes',
        description: 'Créer et modifier les lignes de bus',
        icon: Route,
        color: 'bg-emsp-lightGreen',
        path: '/parametres/lignes',
      },
      {
        title: 'Gestion des prix',
        description: 'Configurer les prix mensuels et l\'historique',
        icon: DollarSign,
        color: 'bg-emsp-yellow',
        path: '/parametres/prix',
      },
    ] : []),
  ]

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
              Administration
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion complète de la plateforme
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section, index) => {
              const Icon = section.icon
              const Content = (
                <div className="flex items-start space-x-4">
                  <motion.div
                    className={`${section.color} text-white p-4 rounded-xl`}
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon size={24} />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-emsp-green mb-2">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{section.description}</p>
                  </div>
                </div>
              )

              return section.path ? (
                <AnimatedCard key={index} delay={index * 0.1} className="p-6 hover:border-emsp-lightGreen border-2 border-transparent transition-colors">
                  <Link to={section.path} className="block">
                    {Content}
                  </Link>
                </AnimatedCard>
              ) : (
                <AnimatedCard key={index} delay={index * 0.1} className="p-6">
                  {Content}
                </AnimatedCard>
              )
            })}
          </div>

          {/* Zone Dangereuse - Seulement pour les admins */}
          {isAdmin && (
            <div className="mt-8 border-2 border-red-500 rounded-lg p-6 bg-red-50">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Zone Dangereuse
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-red-600 mb-2">
                      Réinitialiser la base de données
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Supprime toutes les données (étudiants, paiements, contrôleurs, etc.)
                      sauf les comptes administrateurs. Un backup sera créé automatiquement.
                    </p>
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-5 h-5" />
                      Réinitialiser tout
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </PageTransition>

      {/* Modal de réinitialisation */}
      <ResetDatabaseModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </Layout>
  )
}
