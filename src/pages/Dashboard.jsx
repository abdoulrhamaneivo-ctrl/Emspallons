import { useAuth } from '../context/AuthContext'
import { Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'

export default function Dashboard() {
  const { user, role } = useAuth()

  // Données de démonstration (à remplacer par des appels Supabase)
  const stats = [
    {
      title: 'Étudiants',
      value: '245',
      icon: Users,
      color: 'text-emsp-green',
      bgColor: 'bg-emsp-green-light',
    },
    {
      title: 'Paiements ce mois',
      value: '12,450 €',
      icon: DollarSign,
      color: 'text-emsp-yellow',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Présents aujourd\'hui',
      value: '198',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'En attente',
      value: '47',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-emsp-green">
            Tableau de bord
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenue, {user?.email} ({role})
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-emsp-green">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}
                  >
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-emsp-green mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(role === 'admin' || role === 'educator') && (
              <>
                <button className="btn-primary text-left p-4">
                  Ajouter un étudiant
                </button>
                <button className="btn-secondary text-left p-4">
                  Enregistrer un paiement
                </button>
                <button className="bg-emsp-green-light text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-600 transition-colors text-left p-4">
                  Générer un rapport
                </button>
              </>
            )}
            {role === 'controller' && (
              <button className="btn-primary text-left p-4">
                Scanner un QR Code
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

