import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { Users, Settings, BarChart3, UserCheck, History } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedCard from '../components/ui/AnimatedCard'
import PageTransition from '../components/ui/PageTransition'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { isAdmin } = useAuth()
  
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
      title: 'Gestion des promotions',
      description: 'Créer et modifier les promotions disponibles',
      icon: BarChart3,
      color: 'bg-emsp-green',
      path: '/admin/promotions',
    }] : []),
    {
      title: 'Historique des scans',
      description: 'Consulter l\'historique complet des scans QR',
      icon: History,
      color: 'bg-emsp-lightGreen',
      path: '/admin/scan-history',
    },
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
        </div>
      </PageTransition>
    </Layout>
  )
}
