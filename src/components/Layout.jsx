import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import Sidebar from './navigation/Sidebar'
import BottomNav from './navigation/BottomNav'
import Logo from './ui/Logo'

export default function Layout({ children }) {
  const { user, role } = useAuth()
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Fermer la sidebar au changement de page sur mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

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

      {/* Sidebar Mobile avec Overlay */}
      {isMobile && (
        <>
          {/* Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[998]"
              onClick={() => setSidebarOpen(false)}
              style={{ pointerEvents: 'auto' }}
            />
          )}
          
          {/* Sidebar Mobile */}
          <div
            className={`fixed inset-y-0 left-0 w-64 transform transition-transform duration-300 z-[999] ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
          >
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)}
              isTablet={false}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col min-w-0"
        style={{ 
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Header - Desktop et Tablet */}
        {!isMobile && (
          <header className="bg-gradient-to-r from-emsp-green to-emsp-green/90 text-white shadow-md">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {isTablet && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-emsp-green/20 rounded-lg transition-colors"
                    style={{ 
                      pointerEvents: 'auto',
                      minWidth: '44px',
                      minHeight: '44px'
                    }}
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

        {/* Header Mobile */}
        {isMobile && (
          <div className="sticky top-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              style={{ 
                pointerEvents: 'auto',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold">EMSP Transport</h1>
            <div className="w-10" /> {/* Spacer pour centrer le titre */}
          </div>
        )}

        {/* Main Content */}
        <main 
          className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'pb-20 px-2 py-2' : 'p-4 sm:p-6 lg:p-8'}`}
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            minHeight: 0 // Permet au scroll de fonctionner correctement
          }}
        >
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[1000]"
          style={{ pointerEvents: 'auto' }}
        >
          <BottomNav />
        </div>
      )}
    </div>
  )
}
