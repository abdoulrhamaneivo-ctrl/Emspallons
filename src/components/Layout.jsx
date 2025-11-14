import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Layout({ children }) {
  const { user, role, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Déconnexion réussie')
      navigate('/login')
    } catch (error) {
      toast.error('Erreur lors de la déconnexion')
    }
  }

  const isActive = (path) => location.pathname === path

  const navItems = [
    ...(role === 'admin' || role === 'educator'
      ? [
          { path: '/dashboard', label: 'Tableau de bord' },
          { path: '/students', label: 'Étudiants' },
          { path: '/payments', label: 'Paiements' },
        ]
      : []),
    ...(role === 'admin'
      ? [{ path: '/admin', label: 'Administration' }]
      : []),
    ...(role === 'controller'
      ? [{ path: '/scan', label: 'Scanner QR' }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emsp-green text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-emsp-yellow rounded-lg flex items-center justify-center">
                  <span className="text-emsp-green font-bold text-xl">E</span>
                </div>
                <span className="font-bold text-xl">EMSP Transport</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-emsp-yellow text-emsp-green'
                      : 'hover:bg-emsp-green-light'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emsp-green-light flex items-center space-x-1"
                >
                  <LogOut size={16} />
                  <span>Déconnexion</span>
                </button>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emsp-green-light">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-emsp-yellow text-emsp-green'
                      : 'hover:bg-emsp-green-light'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-emsp-green-light flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Déconnexion</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

