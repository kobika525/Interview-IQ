import { Outlet, useLocation } from 'react-router-dom'

export default function AuthLayout() {
  const { pathname } = useLocation()
  const isRegister = pathname === '/register'

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4 sm:p-8">
      <div className={`w-full ${isRegister ? 'max-w-[680px]' : 'max-w-[420px]'} overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_70px_rgba(0,0,0,0.65)]`}>
        <div className="border-b border-border-subtle bg-card-2 px-7 py-5 text-center">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            {isRegister ? 'Register Form' : 'Login Form'}
          </h1>
        </div>
        <div className="auth-form-theme p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
