import { Link, useLocation } from 'react-router-dom'
import { Home, GraduationCap, DollarSign, BarChart3, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const location = useLocation()
  const { role, user } = useAuth()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  if (!user) {
    return null
  }

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const mainItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/students', label: 'Étudiants', icon: GraduationCap },
    { path: '/payments', label: 'Paiements', icon: DollarSign },
    { path: '/rapports', label: 'Stats', icon: BarChart3 },
  ]

  const moreItems = [
    { path: '/rappels', label: 'Rappels' },
    { path: '/admin/scan-history', label: 'Historique' },
    { path: '/admin', label: 'Administration' },
    { path: '/aide', label: 'Aide' },
    { path: '/profile', label: 'Profil' },
  ]

  if (role === 'controller') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16 px-2" style={{ minHeight: '64px', paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
          <Link
            to="/scan"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/scan') ? 'text-emsp-yellow' : 'text-gray-600'
            }`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Scanner</span>
          </Link>
          <Link
            to="/scanner/historique"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/scanner/historique') ? 'text-emsp-yellow' : 'text-gray-600'
            }`}
          >
            <BarChart3 size={24} />
            <span className="text-xs mt-1">Historique</span>
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16 px-2" style={{ minHeight: '64px', paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
          {mainItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive(item.path)
                    ? 'text-emsp-yellow'
                    : 'text-gray-600 hover:text-emsp-green'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-emsp-yellow"
                    layoutId="bottomNavIndicator"
                  />
                )}
              </Link>
            )
          })}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              showMoreMenu ? 'text-emsp-yellow' : 'text-gray-600'
            }`}
          >
            <MoreVertical size={24} />
            <span className="text-xs mt-1 font-medium">Plus</span>
          </button>
        </div>
      </nav>

      {/* Menu Plus */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMoreMenu(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
            >
              <div className="p-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-emsp-green mb-4 px-4">
                  Plus d&apos;options
                </h3>
                <div className="space-y-2">
                  {moreItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMoreMenu(false)}
                      className={`block px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-emsp-yellow text-emsp-green'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}


