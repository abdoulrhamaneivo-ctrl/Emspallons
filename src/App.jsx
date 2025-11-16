import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { ROLES } from './lib/constants'
import { AnimatePresence, motion } from 'framer-motion'
import HelpPrompt from './components/ui/HelpPrompt'
import { useUserPresence } from './hooks/useUserPresence'
import { CardSkeleton, TableSkeleton } from './components/ui/LoadingSkeleton'
import { SEO } from './components/SEO'

const lazyWithPreload = (loader) => {
  const Component = lazy(loader)
  Component.preload = loader
  return Component
}

// Pages - Lazy loading pour optimiser les performances
const Login = lazyWithPreload(() => import('./pages/Login'))
const Register = lazyWithPreload(() => import('./pages/Register'))
const Dashboard = lazyWithPreload(() => import('./pages/Dashboard'))
const Students = lazyWithPreload(() => import('./pages/Students'))
const Payments = lazyWithPreload(() => import('./pages/Payments'))
// ScanQR chargé de manière synchrone pour éviter les suspensions lors de la navigation
import ScanQR from './pages/ScanQR'
const ScanHistory = lazyWithPreload(() => import('./pages/ScanHistory'))
const ControllerHistory = lazyWithPreload(() => import('./pages/ControllerHistory'))
const Controllers = lazyWithPreload(() => import('./pages/Controllers'))
const Admin = lazyWithPreload(() => import('./pages/Admin'))
const AdminUsers = lazyWithPreload(() => import('./pages/AdminUsers'))
const AdminClasses = lazyWithPreload(() => import('./pages/AdminClasses'))
const AdminNiveaux = lazyWithPreload(() => import('./pages/AdminNiveaux'))
const AdminActivityLogs = lazyWithPreload(() => import('./pages/AdminActivityLogs'))
const AdminLogs = lazyWithPreload(() => import('./pages/AdminLogs'))
const AdminLignes = lazyWithPreload(() => import('./pages/AdminLignes'))
const AdminPrix = lazyWithPreload(() => import('./pages/AdminPrix'))
const AdminPausedMonths = lazyWithPreload(() => import('./pages/AdminPausedMonths'))
const Rapports = lazyWithPreload(() => import('./pages/Rapports'))
const Rappels = lazyWithPreload(() => import('./pages/Rappels'))
const Aide = lazyWithPreload(() => import('./pages/Aide'))
const Profile = lazyWithPreload(() => import('./pages/Profile'))
const Unauthorized = lazyWithPreload(() => import('./pages/Unauthorized'))
const Test = lazyWithPreload(() => import('./pages/Test'))
const ResetSuccess = lazyWithPreload(() => import('./pages/ResetSuccess'))
const BilanMensuel = lazyWithPreload(() => import('./pages/BilanMensuel'))
const OnboardingTour = lazyWithPreload(() => import('./components/onboarding/OnboardingTour'))

const criticalPrefetchComponents = [
  Dashboard,
  Students,
  Payments,
  // ScanQR n'est plus lazy-loaded, donc pas besoin de préchargement
  Controllers,
  AdminUsers,
  BilanMensuel,
]

// Composant de chargement
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emsp-green/5">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="rounded-full h-16 w-16 border-4 border-emsp-yellow/30 border-t-emsp-yellow mx-auto mb-4"
      />
      <p className="text-emsp-green font-bold text-lg">Chargement...</p>
    </div>
  </div>
)

function AppRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  // Activer le suivi de présence globalement
  useUserPresence()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Précharger les composants critiques de manière optimisée
    const schedulePrefetch = () => {
      const task = () => {
        // Précharger les composants critiques en parallèle mais avec un délai échelonné
        criticalPrefetchComponents.forEach((Component, index) => {
          setTimeout(() => {
            try {
              Component.preload?.()
            } catch (error) {
              // Erreur non bloquante lors du préchargement
            }
          }, index * 100) // Délai échelonné de 100ms entre chaque composant
        })
      }

      // Utiliser requestIdleCallback si disponible, sinon setTimeout
      if ('requestIdleCallback' in window) {
        const id = window.requestIdleCallback(task, { timeout: 1500 })
        return () => window.cancelIdleCallback?.(id)
      }

      // Fallback pour navigateurs sans support requestIdleCallback
      const timeoutId = window.setTimeout(task, 800)
      return () => window.clearTimeout(timeoutId)
    }

    const cleanup = schedulePrefetch()
    return () => cleanup && cleanup()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emsp-green/5 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emsp-yellow/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emsp-lightGreen/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="rounded-full h-16 w-16 border-4 border-emsp-yellow/30 border-t-emsp-yellow mx-auto mb-4 shadow-lg"
          />
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-emsp-green font-bold text-lg"
          >
            Chargement...
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <SEO />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" replace /> : <Register />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR, ROLES.CONTROLLER]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={<ScanQR />}
          />
          <Route
            path="/scanner/historique"
            element={<ControllerHistory />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/controllers"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <Controllers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/scan-history"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <ScanHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <AdminClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/niveaux"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminNiveaux />
              </ProtectedRoute>
            }
          />
        <Route
          path="/admin/activity-logs"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminActivityLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLogs />
            </ProtectedRoute>
          }
        />
          <Route
            path="/rapports"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <Rapports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bilan-mensuel"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <BilanMensuel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rappels"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                <Rappels />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aide"
            element={<Aide />}
          />
          <Route
            path="/parametres/lignes"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminLignes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parametres/prix"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminPrix />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/paused-months"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminPausedMonths />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR, ROLES.CONTROLLER]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-success"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <ResetSuccess />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          {/* Page de test - uniquement en développement */}
          {!import.meta.env.PROD && (
            <Route
              path="/test"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EDUCATOR]}>
                  <Suspense fallback={<PageLoader />}>
                    <Test />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          )}
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
      
      {/* Composants globaux en dehors de AnimatePresence */}
      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>
      <HelpPrompt />
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2D5016',
              color: '#fff',
              border: '1px solid #7CB342',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              duration: 3000,
              style: {
                background: '#7CB342',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#7CB342',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            loading: {
              style: {
                background: '#FDB913',
                color: '#fff',
              },
            },
          }}
        />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
