import { useEffect, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Button } from '../components/ui'
import Layout from '../components/Layout'
import PageTransition from '../components/ui/PageTransition'

export default function ResetSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirection automatique après 10 secondes
    const timer = setTimeout(() => {
      // Utiliser startTransition pour les lazy-loaded components (React 18)
      startTransition(() => {
        navigate('/dashboard')
      })
    }, 10000)
    
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <Layout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-emsp-yellow/20 to-emsp-lightGreen/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Réinitialisation Terminée
            </h1>
            
            <p className="text-gray-600 mb-6">
              La base de données a été réinitialisée avec succès.
              Toutes les données ont été supprimées sauf les comptes administrateurs.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                💾 Un backup a été téléchargé automatiquement
              </p>
            </div>

            <Button
              onClick={() => {
                // Utiliser startTransition pour les lazy-loaded components (React 18)
                startTransition(() => {
                  navigate('/dashboard')
                })
              }}
              className="w-full bg-emsp-green hover:bg-emsp-lightGreen text-white"
            >
              Retour au tableau de bord
            </Button>

            <p className="text-sm text-gray-500 mt-4">
              Redirection automatique dans 10 secondes...
            </p>
          </div>
        </div>
      </PageTransition>
    </Layout>
  )
}

