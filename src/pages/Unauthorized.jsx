import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ShieldX } from 'lucide-react'

export default function Unauthorized() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <ShieldX size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-3xl font-bold text-emsp-green mb-2">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </Layout>
  )
}

