import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'
import logger from '../lib/logger'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading, profile } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Debug: Log pour comprendre le problème (uniquement en développement)
  if (allowedRoles.length > 0) {
    logger.debug('ProtectedRoute Debug', null, {
      userId: user?.id,
      userEmail: user?.email,
      role,
      allowedRoles,
      hasRole: allowedRoles.includes(role),
    })
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Si le rôle est null mais que l'utilisateur existe, c'est un problème de profil
    if (role === null && user) {
      logger.error('User exists but role is null', null, { userId: user?.id, profile })
    }
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

