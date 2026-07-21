import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../utils/permissions'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app text-blue">
        <LoadingSpinner size={32} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin(user)) return <Navigate to="/app/dashboard" replace />
  return <Outlet />
}
