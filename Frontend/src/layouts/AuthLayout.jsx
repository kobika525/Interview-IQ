import { Outlet } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import AuthIllustration from '../components/auth/AuthIllustration'
import Logo from '../components/common/Logo'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-auth-bg flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-auth-decor blur-3xl opacity-70" />
      <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-auth-decor blur-3xl opacity-70" />

      <div className="relative w-full max-w-[1100px] min-h-[650px] rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(6,50,90,0.35)] bg-auth-dark flex flex-col md:flex-row">
        {/* Mobile-only compact header */}
        <div className="md:hidden flex flex-col items-center pt-8 pb-2 px-6">
          <Logo size="sm" to={null} />
          <div className="w-20 h-20 mt-4 rounded-2xl bg-gradient-to-br from-blue/30 to-cyan/30 flex items-center justify-center animate-pulse-glow">
            <Sparkles size={26} className="text-cyan" />
          </div>
        </div>

        <div className="hidden md:block md:w-[48%]">
          <AuthIllustration />
        </div>

        <div className="w-full md:w-[52%] p-6 sm:p-10 md:p-12 flex flex-col justify-center">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
