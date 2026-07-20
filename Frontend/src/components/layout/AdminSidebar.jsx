import { NavLink } from 'react-router-dom'
import { LayoutGrid, Users, HelpCircle, Briefcase, BookOpen, CreditCard, FileBarChart, BarChart3, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../utils/helpers'
import Logo from '../common/Logo'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
  { to: '/admin/career-roles', label: 'Career Roles', icon: Briefcase },
  { to: '/admin/resources', label: 'Learning Resources', icon: BookOpen },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
  const { logout } = useAuth()
  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="px-5 py-5">
        <Logo size="sm" to="/admin" />
        <span className="text-[10px] text-text-muted uppercase tracking-wide ml-[42px]">Admin console</span>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cx('nav-link', isActive && 'nav-link-active')}>
            <item.icon size={18} />{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-border-subtle">
        <button onClick={logout} className="nav-link w-full"><LogOut size={18} />Exit Admin</button>
      </div>
    </div>
  )
}
