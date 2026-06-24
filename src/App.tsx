import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { CustomerDashboardPage } from '@/pages/CustomerDashboardPage'
import { HomePage } from '@/pages/HomePage'
import { VendorDashboardPage } from '@/pages/VendorDashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode
  role?: 'customer' | 'vendor'
}) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'vendor' ? '/vendor' : '/customer'} replace />
  }

  return children
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/customer"
        element={
          <ProtectedRoute role="customer">
            <CustomerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor"
        element={
          <ProtectedRoute role="vendor">
            <VendorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
