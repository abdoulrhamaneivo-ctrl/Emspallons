import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'
import logger from '../lib/logger'
import { useState, useEffect } from 'react'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading, profile } = useAuth()
  const [waitingForRole, setWaitingForRole] = useState(false)
  const [roleLoadTimeout, setRoleLoadTimeout] = useState(false)

  // Si on a besoin d'un rôle mais qu'il n'est pas encore chargé, attendre un peu
  useEffect(() => {
    if (allowedRoles.length > 0 && user && role === null && !loading) {
      setWaitingForRole(true)
      // Attendre maximum 1.5 secondes pour le chargement du rôle (réduit pour plus de réactivité)
      const timeout = setTimeout(() => {
        setRoleLoadTimeout(true)
        setWaitingForRole(false)
        logger.warn('Role loading timeout reached', { userId: user?.id })
      }, 1500) // Réduit de 2000ms à 1500ms

      return () => clearTimeout(timeout)
    } else if (role !== null) {
      setWaitingForRole(false)
      setRoleLoadTimeout(false)
    }
  }, [user, role, loading, allowedRoles.length])

  // Attendre si on n'a pas encore de session (premier chargement)
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si on attend le chargement du rôle
  if (allowedRoles.length > 0 && role === null && user && waitingForRole && !roleLoadTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  // Debug: Log pour comprendre le problème (uniquement en développement)
  if (allowedRoles.length > 0) {
    logger.debug('ProtectedRoute Debug', null, {
      userId: user?.id,
      userEmail: user?.email,
      role,
      allowedRoles,
      hasRole: allowedRoles.includes(role),
      loading,
    })
  }

  // Si pas de restrictions de rôle, autoriser l'accès
  if (allowedRoles.length === 0) {
    return children
  }

  // Vérifier les permissions seulement après le chargement du rôle
  if (allowedRoles.length > 0 && role === null && user && (roleLoadTimeout || !waitingForRole)) {
    // Le profil n'a pas de rôle ou n'a pas pu être chargé
    logger.error('User exists but role is null after loading timeout', null, { 
      userId: user?.id, 
      profile,
      email: user?.email 
    })
    return <Navigate to="/unauthorized" replace />
  }

  // Si le rôle existe mais n'est pas autorisé
  if (role !== null && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Si le rôle est null mais qu'on attend encore, afficher le chargement
  // (géré plus haut dans le code)

  return children
}

