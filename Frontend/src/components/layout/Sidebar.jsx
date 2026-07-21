import { NavLink, Link } from 'react-router-dom'
import {
  LayoutGrid, FileText, History, Compass, Radar, Map, BookOpen, Mic, ListChecks,
  TrendingUp, Bell, CreditCard, LifeBuoy, Settings, LogOut, Sparkles,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../utils/helpers'
import { isPremium } from '../../utils/permissions'
import Logo from '../common/Logo'
import PlanBadge from '../billing/PlanBadge'

const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/app/resume-analyzer', label: 'Resume Analyzer', icon: FileText },
  { to: '/app/resume-history', label: 'Resume History', icon: History },
  { to: '/app/career-guidance', label: 'Career Guidance', icon: Compass },
  { to: '/app/skill-gap-analysis', label: 'Skill Gap Analysis', icon: Radar },
  { to: '/app/learning-roadmap', label: 'Learning Roadmap', icon: Map },
  { to: '/app/resources', label: 'Learning Resources', icon: BookOpen },
  { to: '/app/interviews', label: 'Interview Hub', icon: Mic },
  { to: '/app/interviews/history', label: 'Interview History', icon: ListChecks },
  { to: '/app/progress', label: 'Progress', icon: TrendingUp },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/app/support', label: 'Support', icon: LifeBuoy },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

/**
 * `compact` renders an icon-only rail (desktop) with native tooltips.
 * The mobile drawer passes `compact={false}` so labels stay visible there,
 * since there's no hover affordance on touch devices.
 */
export default function Sidebar({ onNavigate, compact = false }) {
  const { user, logout } = useAuth()
  const premium = isPremium(user)

  return (
    <div className={cx('flex flex-col h-full bg-sidebar', compact ? 'items-center px-2' : 'px-3')}>
      <div className={cx('py-5', compact ? '' : 'px-2')}>
        <Logo size="sm" withText={!compact} />
      </div>

      <nav className={cx('flex-1 overflow-y-auto overflow-x-hidden py-2 w-full', compact ? 'flex flex-col items-center gap-1.5' : 'space-y-1')}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app/interviews'}
            onClick={onNavigate}
            title={compact ? item.label : undefined}
            className={({ isActive }) => cx(
              compact
                ? 'w-11 h-11 flex items-center justify-center rounded-xl text-text-muted hover:bg-black/[0.04] hover:text-text-primary transition-colors'
                : 'nav-link',
              isActive && (compact ? 'bg-blue/10 text-blue' : 'nav-link-active')
            )}
          >
            <item.icon size={18} />
            {!compact && item.label}
          </NavLink>
        ))}
      </nav>

      {!premium && (
        <div className={cx('w-full', compact ? 'px-1 pb-2' : 'px-0 pb-3')}>
          <Link
            to="/pricing"
            title={compact ? 'Upgrade to Premium' : undefined}
            className={cx(
              'block rounded-xl bg-gradient-to-br from-blue/15 to-cyan/10 border border-blue/25 hover:border-blue/40 transition-colors',
              compact ? 'w-11 h-11 flex items-center justify-center mx-auto' : 'p-3.5'
            )}
          >
            {compact ? (
              <Sparkles size={17} className="text-cyan" />
            ) : (
              <>
                <div className="flex items-center gap-2 text-text-primary text-xs font-semibold"><Sparkles size={13} className="text-cyan" />Upgrade to Premium</div>
                <p className="text-[11px] text-text-muted mt-1">Unlock video interviews &amp; unlimited scans.</p>
              </>
            )}
          </Link>
        </div>
      )}

      <div className={cx('w-full py-4 border-t border-border-subtle', compact ? 'flex flex-col items-center gap-2' : 'space-y-1')}>
        <button onClick={logout} title={compact ? 'Logout' : undefined} className={compact ? 'w-11 h-11 flex items-center justify-center rounded-xl text-text-muted hover:bg-black/[0.04] hover:text-text-primary transition-colors' : 'nav-link w-full'}>
          <LogOut size={18} />
          {!compact && 'Logout'}
        </button>
        <Link
          to="/app/profile"
          title={compact ? user?.fullName : undefined}
          className={cx(
            'flex items-center gap-2.5 rounded-xl bg-black/[0.035] hover:bg-black/[0.06] transition-colors',
            compact ? 'w-11 h-11 justify-center' : 'px-3.5 py-3 mt-2'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-cyan flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
            {user?.fullName?.[0] || 'U'}
          </div>
          {!compact && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">{user?.fullName}</p>
                <p className="text-[11px] text-text-muted truncate">{user?.targetCareer}</p>
              </div>
              <PlanBadge plan={user?.plan} />
            </>
          )}
        </Link>
      </div>
    </div>
  )
}
