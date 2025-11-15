import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ShieldX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Unauthorized() {
  const { user, role, profile } = useAuth()

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldX size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-3xl font-bold text-emsp-green mb-2">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          
          {/* Informations de débogage */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left text-sm">
              <p className="font-semibold mb-2">Informations de débogage :</p>
              <p>Email: {user?.email || 'Non connecté'}</p>
              <p>Rôle: {role || 'Non défini'}</p>
              <p>Profil: {profile ? 'Existe' : 'Non trouvé'}</p>
              {!role && user && (
                <p className="text-red-600 mt-2">
                  ⚠️ Votre profil n'a pas de rôle défini. Contactez un administrateur.
                </p>
              )}
            </div>
          )}
          
          <Link to="/dashboard" className="btn-primary">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </Layout>
  )
}

