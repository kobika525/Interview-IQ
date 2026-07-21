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
    <header className="sticky top-0 z-40 bg-app/85 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
        <Logo size="sm" to="/" />

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-text-secondary">
          {LINKS.map((l) => (
            <NavLink key={l.label} to={l.to} className={({ isActive }) => isActive ? 'text-text-primary' : 'hover:text-text-primary transition-colors'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to={user ? '/app/dashboard' : '/login'} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            {user ? 'Dashboard' : 'Login'}
          </Link>
          <Link to={user ? '/app/dashboard' : '/register'}><Button>Get Started</Button></Link>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="btn-icon md:hidden" aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border-subtle px-4 py-4 space-y-3">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="block text-sm text-text-secondary py-1.5">
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link to="/login" className="flex-1"><Button variant="outline" fullWidth>Login</Button></Link>
            <Link to="/register" className="flex-1"><Button fullWidth>Get Started</Button></Link>
          </div>
        </div>
      )}
    </header>
  )
}
