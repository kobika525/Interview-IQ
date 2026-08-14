import { Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/common/Logo'

export default function AuthLayout() {
  const { pathname } = useLocation()
  const isRegister = pathname === '/register'
  const isPrimaryAuth = pathname === '/login' || isRegister

  if (!isPrimaryAuth) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
          <div className="auth-form-theme p-6 sm:p-8"><Outlet /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-neon-page min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className={`auth-neon-card ${isRegister ? 'max-w-[1120px]' : 'max-w-[940px]'}`}>
        <section className="auth-neon-intro">
          <div className="relative z-10"><Logo size="sm" to="/" /></div>
          <div className="relative z-10 my-auto max-w-[280px]">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-white/70">Interview IQ</p>
            <h1 className="font-display text-4xl font-black uppercase leading-[1.02] text-white sm:text-5xl">
              {isRegister ? <>Register<br />yourself!</> : <>Welcome<br />back!</>}
            </h1>
            <p className="mt-5 text-sm leading-6 text-white/75">
              {isRegister
                ? 'Build your profile and start preparing for interviews with confidence.'
                : 'Continue your practice, sharpen your answers and get closer to your next opportunity.'}
            </p>
          </div>
          <p className="relative z-10 text-xs text-white/55">Prepare smarter. Interview better.</p>
        </section>

        <section className={`auth-neon-form ${isRegister ? 'lg:py-9' : ''}`}>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan">Your account</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">{isRegister ? 'Sign Up' : 'Login'}</h2>
            <div className="mt-3 h-0.5 w-14 bg-cyan shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          </div>
          <div className="auth-neon-fields">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  )
}
