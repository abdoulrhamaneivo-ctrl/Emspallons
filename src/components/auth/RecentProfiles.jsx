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
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Connexions récentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {profiles.slice(0, 3).map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AnimatedCard
                delay={0}
                className="p-4 cursor-pointer hover:border-emsp-lightGreen border-2 border-transparent transition-all"
                onClick={() => handleQuickLogin(profile)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emsp-yellow to-emsp-lightGreen flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(profile.name)}
                    </div>
                    <button
                      onClick={(e) => handleRemoveProfile(e, profile.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-emsp-green truncate">{profile.name}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                      {getRoleLabel(profile.role)}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <AnimatedButton
                    variant="outline"
                    className="w-full text-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickLogin(profile)
                    }}
                  >
                    Connexion rapide
                  </AnimatedButton>
                </div>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={onUseOtherAccount}
            className="text-sm text-emsp-green hover:text-emsp-lightGreen font-medium transition-colors"
          >
            Autre compte →
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

