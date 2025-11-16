import { useState } from 'react'
import { User, X } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedCard from '../ui/AnimatedCard'
import AnimatedButton from '../ui/AnimatedButton'
import QuickLoginModal from './QuickLoginModal'
import { getRecentProfiles, removeRecentProfile } from '../../lib/recentProfiles'
import { useAuth } from '../../context/AuthContext'

export default function RecentProfiles({ onUseOtherAccount }) {
  const { signIn } = useAuth()
  const [profiles] = useState(() => getRecentProfiles())
  const [showQuickLogin, setShowQuickLogin] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)

  const handleQuickLogin = (profile) => {
    setSelectedProfile(profile)
    setShowQuickLogin(true)
  }

  const handleRemoveProfile = (e, profileId) => {
    e.stopPropagation()
    removeRecentProfile(profileId)
    // Recharger la page pour mettre à jour la liste
    window.location.reload()
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      educator: 'bg-blue-100 text-blue-800',
      controller: 'bg-green-100 text-green-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      educator: 'Éducateur',
      controller: 'Contrôleur',
    }
    return labels[role] || role
  }

  if (profiles.length === 0) {
    return (
      <div className="mb-6 text-center">
        <button
          onClick={onUseOtherAccount}
          className="text-sm text-emsp-green hover:text-emsp-lightGreen font-medium transition-colors"
        >
          Se connecter avec un autre compte →
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-5 fade-in">Connexions récentes</h3>
        <div className="space-y-5">
          {profiles.slice(0, 3).map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.15,
                duration: 0.5,
                type: 'spring',
                stiffness: 100
              }}
              className="card-enter"
            >
              <div
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-emsp-lightGreen transition-all duration-300 overflow-hidden"
                style={{
                  animation: `cardSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s both`
                }}
              >
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                
                {/* Bouton de suppression en haut à droite */}
                <button
                  onClick={(e) => handleRemoveProfile(e, profile.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
                  title="Supprimer"
                  style={{
                    animation: 'scaleIn 0.3s ease-out'
                  }}
                >
                  <X size={16} />
                </button>

                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => handleQuickLogin(profile)}
                >
                  <div className="flex items-center gap-5">
                    {/* Avatar avec animation */}
                    <div className="relative flex-shrink-0">
                      <div 
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-emsp-yellow via-emsp-lightGreen to-emsp-green flex items-center justify-center text-white font-bold text-2xl shadow-xl group-hover:scale-110 transition-transform duration-300 float"
                        style={{
                          animation: `float 3s ease-in-out infinite ${index * 0.5}s`
                        }}
                      >
                        {getInitials(profile.name)}
                      </div>
                      {/* Cercle animé autour de l'avatar */}
                      <div className="absolute inset-0 rounded-full border-2 border-emsp-yellow/30 group-hover:border-emsp-lightGreen group-hover:scale-125 transition-all duration-500"></div>
                    </div>

                    {/* Informations utilisateur */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xl text-emsp-green mb-2 group-hover:text-emsp-lightGreen transition-colors duration-300">
                        {profile.name}
                      </p>
                      <span 
                        className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${getRoleBadgeColor(profile.role)} shadow-md scale-in`}
                        style={{
                          animation: `scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15 + 0.2}s both`
                        }}
                      >
                        {getRoleLabel(profile.role)}
                      </span>
                    </div>

                    {/* Bouton de connexion */}
                    <div className="flex-shrink-0">
                      <AnimatedButton
                        variant="primary"
                        className="px-8 py-3 text-base font-bold whitespace-nowrap shadow-lg hover:shadow-xl button-pulse"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickLogin(profile)
                        }}
                        style={{
                          animation: `buttonSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15 + 0.3}s both`
                        }}
                      >
                        Connexion →
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={onUseOtherAccount}
            className="text-base text-emsp-green hover:text-emsp-lightGreen font-semibold transition-all duration-300 hover:scale-105 hover:underline inline-flex items-center gap-2 fade-in"
            style={{
              animation: 'fadeIn 0.5s ease-out 0.9s both'
            }}
          >
            <span>Autre compte</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      {showQuickLogin && selectedProfile && (
        <QuickLoginModal
          isOpen={showQuickLogin}
          onClose={() => {
            setShowQuickLogin(false)
            setSelectedProfile(null)
          }}
          profile={selectedProfile}
          onSuccess={() => {
            setShowQuickLogin(false)
            setSelectedProfile(null)
          }}
        />
      )}
    </>
  )
}

