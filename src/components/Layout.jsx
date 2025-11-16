import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import Sidebar from './navigation/Sidebar'
import BottomNav from './navigation/BottomNav'
import Logo from './ui/Logo'

export default function Layout({ children }) {
  const { user, role } = useAuth()
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emsp-green/5 flex">
      {/* Sidebar - Desktop et Tablet */}
      {!isMobile && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isTablet={isTablet}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Desktop et Tablet */}
        {!isMobile && (
          <header className="bg-gradient-to-r from-emsp-green to-emsp-green/90 text-white shadow-md">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {isTablet && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-emsp-green/20 rounded-lg transition-colors"
                  >
                    <Menu size={24} />
                  </button>
                )}
                <div className="flex items-center flex-1 justify-center md:justify-start">
                  <Link to="/dashboard" className="flex items-center space-x-2">
                    <Logo size="md" showText={!isTablet} variant="transport" />
                  </Link>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20 px-2 py-2' : 'p-4 sm:p-6 lg:p-8'}`}>
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav />}
    </div>
  )
}
