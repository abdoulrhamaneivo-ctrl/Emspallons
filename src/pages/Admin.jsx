import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { Users, Settings, Shield, BarChart3, UserCheck, History } from 'lucide-react'

export default function Admin() {
  const adminSections = [
    {
      title: 'Gestion des utilisateurs',
      description: 'Gérer les comptes admin, éducateurs et contrôleurs',
      icon: Users,
      color: 'bg-emsp-green',
      path: '/admin/users',
    },
    {
      title: 'Gestion des contrôleurs',
      description: 'Créer et gérer les contrôleurs de bus',
      icon: UserCheck,
      color: 'bg-emsp-green-light',
      path: '/admin/controllers',
    },
    {
      title: 'Historique des scans',
      description: 'Consulter l\'historique complet des scans QR',
      icon: History,
      color: 'bg-emsp-yellow',
      path: '/admin/scan-history',
    },
    {
      title: 'Paramètres système',
      description: 'Configurer les paramètres de la plateforme',
      icon: Settings,
      color: 'bg-emsp-green',
      path: '/admin/settings',
    },
    {
      title: 'Gestion des rôles',
      description: 'Attribuer et modifier les permissions',
      icon: Shield,
      color: 'bg-emsp-green-light',
      path: '/admin/roles',
    },
    {
      title: 'Rapports et statistiques',
      description: 'Analyser les données et générer des rapports',
      icon: BarChart3,
      color: 'bg-emsp-yellow',
      path: '/admin/reports',
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-emsp-green">
            Administration
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion complète de la plateforme
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => {
            const Icon = section.icon
            const Content = (
              <div className="flex items-start space-x-4">
                <div
                  className={`${section.color} text-white p-4 rounded-lg`}
                >
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-emsp-green mb-2">
                    {section.title}
                  </h3>
                  <p className="text-gray-600">{section.description}</p>
                </div>
              </div>
            )

            return section.path ? (
              <Link
                key={index}
                to={section.path}
                className="card hover:shadow-lg transition-shadow cursor-pointer block"
              >
                {Content}
              </Link>
            ) : (
              <div
                key={index}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                {Content}
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

