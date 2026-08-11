import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../common/Button'
import Logo from '../common/Logo'

const LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/#interview-modes', label: 'Interview Practice' },
  { to: '/#resume-preview', label: 'Resume Analyzer' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/app/resources', label: 'Resources' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.75)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-20">
        <Logo size="sm" to="/" textClassName="text-white" />

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/75">
          {LINKS.map((l) => (
            <NavLink key={l.label} to={l.to} className={({ isActive }) => isActive ? 'text-white' : 'hover:text-white transition-colors'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to={user ? '/app/dashboard' : '/login'} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            {user ? 'Dashboard' : 'Login'}
          </Link>
          <Link to={user ? '/app/dashboard' : '/register'}><Button className="bg-lime-400 text-slate-950 hover:bg-lime-300 shadow-[0_12px_30px_-18px_rgba(132,204,22,0.55)]">Get Started</Button></Link>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="btn-icon md:hidden" aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 py-4 space-y-3">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="block text-sm text-white/80 py-1.5 hover:text-white">
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link to="/login" className="flex-1"><Button variant="outline" fullWidth className="border-white/30 text-white hover:border-white hover:text-white">Login</Button></Link>
            <Link to="/register" className="flex-1"><Button fullWidth className="bg-lime-400 text-slate-950 hover:bg-lime-300">Get Started</Button></Link>
          </div>
        </div>
      )}
    </header>
  )
}
