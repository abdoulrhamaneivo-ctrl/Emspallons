import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { ROLES } from './lib/constants'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Payments from './pages/Payments'
import ScanQR from './pages/ScanQR'
import ScanHistory from './pages/ScanHistory'
import Controllers from './pages/Controllers'
import Admin from './pages/Admin'
import Unauthorized from './pages/Unauthorized'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
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
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/controllers"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
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
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#7CB342',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  )
}

export default App

