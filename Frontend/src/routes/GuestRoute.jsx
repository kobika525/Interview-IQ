import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../utils/permissions'

// Redirects already-authenticated users away from guest-only pages (login/register) to the dashboard.
export default function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={isAdmin(user) ? '/admin' : '/app/dashboard'} replace />
  return <Outlet />
}
