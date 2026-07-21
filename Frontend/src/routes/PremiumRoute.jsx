import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isPremium } from '../utils/permissions'
import LoadingSpinner from '../components/common/LoadingSpinner'

// Gates a route behind an active Premium/Pro subscription. Assumes ProtectedRoute
// has already confirmed the person is logged in when nested beneath it.
export default function PremiumRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app text-blue">
        <LoadingSpinner size={32} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isPremium(user)) return <Navigate to="/pricing" state={{ upgradeReason: location.pathname }} replace />
  return <Outlet />
}
