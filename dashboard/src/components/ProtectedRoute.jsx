import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/authStorage'

// AuthProvider initialises token synchronously from localStorage (via
// getStoredAuth() inside useState), so isAuthenticated is correct on the very
// first render — there is no async loading phase and no transient false value
// that would cause a spurious redirect to /login.
//
// allowedRoles (optional): string or string[]. If provided, authenticated users
// whose role is not in the list are sent to /unauthorized instead of /login.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !hasPermission(allowedRoles)) return <Navigate to="/unauthorized" replace />
  return children
}
