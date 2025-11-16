import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, GraduationCap, DollarSign, FileText, Bell,
  History, Settings, HelpCircle, User, LogOut, X, Play, BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { startTransition } from 'react'
import toast from 'react-hot-toast'
import Logo from '../ui/Logo'

export default function Sidebar({ isOpen, onClose, isTablet }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role, signOut } = useAuth()

  if (!user) {
    return null
  }

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Déconnexion réussie')
      // Utiliser startTransition pour les lazy-loaded components (React 18)
      setTimeout(() => {
        startTransition(() => {
          navigate('/login')
        })
      }, 500)
    } catch (error) {
      toast.error('Erreur lors de la déconnexion')
    }
  }

  const navItems = [
    ...(role === 'admin' || role === 'educator'
      ? [
          { path: '/dashboard', label: 'Tableau de bord', icon: Home },
          { path: '/students', label: 'Étudiants', icon: GraduationCap },
          { path: '/payments', label: 'Paiements', icon: DollarSign },
          { path: '/rapports', label: 'Rapports', icon: FileText },
          { path: '/bilan-mensuel', label: 'Bilan mensuel', icon: BarChart3 },
          { path: '/rappels', label: 'Rappels', icon: Bell },
          { path: '/admin/scan-history', label: 'Historique Scans', icon: History },
          { path: '/admin', label: 'Administration', icon: Settings },
        ]
      : []),
    ...(role === 'controller'
      ? [
          { path: '/scan', label: 'Scanner QR', icon: Home },
          { path: '/scanner/historique', label: 'Mon Historique', icon: History },
        ]
      : []),
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Logo className="h-8" />
        {isTablet && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2" data-tour="nav-sidebar">
        {navItems.map((item) => {
          const Icon = item.icon
          const dataTourId = item.path === '/students' ? 'nav-students' : 
                           item.path === '/payments' ? 'nav-payments' :
                           item.path === '/rapports' || item.path === '/bilan-mensuel' ? 'nav-reports' :
                           item.path === '/admin' ? 'nav-admin' :
                           item.path === '/admin/scan-history' ? 'nav-scan-history' :
                           item.path === '/scanner/historique' ? 'nav-history' : null
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={isTablet ? onClose : undefined}
              data-tour={dataTourId}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-emsp-yellow text-emsp-green font-semibold'
                  : 'text-gray-700 hover:bg-emsp-lightGreen/20'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        <button
          onClick={() => {
            if (window.startOnboardingTour) {
              window.startOnboardingTour()
            }
            if (isTablet) onClose()
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-emsp-lightGreen/20 transition-colors"
        >
          <Play size={20} />
          <span>Guide</span>
        </button>
        <Link
          to="/aide"
          onClick={isTablet ? onClose : undefined}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/aide')
              ? 'bg-emsp-yellow text-emsp-green font-semibold'
              : 'text-gray-700 hover:bg-emsp-lightGreen/20'
          }`}
        >
          <HelpCircle size={20} />
          <span>Aide</span>
        </Link>
        <Link
          to="/profile"
          onClick={isTablet ? onClose : undefined}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/profile')
              ? 'bg-emsp-yellow text-emsp-green font-semibold'
              : 'text-gray-700 hover:bg-emsp-lightGreen/20'
          }`}
        >
          <User size={20} />
          <span>Profil</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )

  if (isTablet) {
    return (
      <>
        {/* Overlay */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-64 z-50"
              >
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop: Sidebar fixe
  return (
    <div className="w-64 flex-shrink-0">
      <SidebarContent />
    </div>
  )
}


