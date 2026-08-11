import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutGrid, FileText, History, Compass, Radar, BookOpen, Map, Mic, ListChecks,
  TrendingUp, CreditCard, Settings, ChevronDown,
  PanelLeftClose, PanelLeftOpen, PlayCircle,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../utils/helpers'
import { isPremium } from '../../utils/permissions'
import Logo from '../common/Logo'
import PlanBadge from '../billing/PlanBadge'

const NAVIGATION = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutGrid },
  {
    id: 'resume', label: 'Resume', icon: FileText,
    children: [
      { to: '/app/resume-analyzer', label: 'Resume Analyzer', icon: FileText },
      { to: '/app/resume-history', label: 'Resume History', icon: History },
    ],
  },
  {
    id: 'career', label: 'Career', icon: Compass,
    children: [
      { to: '/app/career-guidance', label: 'Career Guidance', icon: Compass },
      { to: '/app/skill-gap-analysis', label: 'Skill Gap Analysis', icon: Radar },
    ],
  },
  {
    id: 'learning', label: 'Learning Resources', icon: BookOpen,
    children: [
      { to: '/app/resources', label: 'Learning Resources', icon: BookOpen },
      { to: '/app/learning-roadmap', label: 'Learning Roadmap', icon: Map },
    ],
  },
  {
    id: 'interview', label: 'Mock Interview', icon: Mic,
    children: [
      { to: '/app/interviews/setup', label: 'Start Interview', icon: PlayCircle },
      { to: '/app/interviews/history', label: 'Interview History', icon: ListChecks },
    ],
  },
  { to: '/app/progress', label: 'Progress Tracking', icon: TrendingUp },
  { to: '/app/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

function pathMatches(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function Sidebar({ onNavigate, collapsed = false, onToggle, mobile = false }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const premium = isPremium(user)
  const [openGroups, setOpenGroups] = useState({})
  const compact = collapsed && !mobile

  useEffect(() => {
    const activeGroup = NAVIGATION.find((item) => item.children?.some((child) => pathMatches(pathname, child.to)))
    if (activeGroup) setOpenGroups((groups) => ({ ...groups, [activeGroup.id]: true }))
  }, [pathname])

  function toggleGroup(id) {
    if (!compact) setOpenGroups((groups) => ({ ...groups, [id]: !groups[id] }))
  }

  function logoutAndClose() {
    onNavigate?.()
    logout()
  }

  return (
    <div className={cx('flex h-full flex-col bg-sidebar transition-all duration-300', compact ? 'px-2' : 'px-3')}>
      <div className={cx('flex h-20 shrink-0 items-center border-b border-border-subtle', compact ? 'justify-center' : 'justify-between px-2')}>
        <Logo size="sm" withText={!compact} />
        {!mobile && onToggle && (
          <button type="button" onClick={onToggle} className={cx('btn-icon shrink-0 transition-all duration-200', compact && 'absolute left-5 top-20 border border-border-subtle bg-sidebar shadow-sm')} aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'} title={compact ? 'Expand sidebar' : 'Collapse sidebar'}>
            {compact ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        )}
      </div>

      <nav className={cx('flex-1 overflow-y-auto overflow-x-hidden py-4', compact ? 'space-y-2 pt-8' : 'space-y-1')} aria-label="Main navigation">
        {NAVIGATION.map((item) => {
          if (!item.children) {
            return (
              <NavLink key={item.to} to={item.to} onClick={onNavigate} title={compact ? item.label : undefined} className={({ isActive }) => cx(
                'group flex items-center rounded-xl font-medium transition-all duration-200',
                compact ? 'mx-auto h-11 w-11 justify-center text-text-muted hover:bg-blue/10 hover:text-blue' : 'gap-3 px-3 py-2.5 text-sm text-text-secondary hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-text-primary',
                isActive && 'bg-blue/10 !text-blue shadow-[inset_3px_0_0_0_#B6FF3B]',
              )}>
                {!compact && <span>{item.label}</span>}
              </NavLink>
            )
          }

          const groupActive = item.children.some((child) => pathMatches(pathname, child.to))
          const open = openGroups[item.id]
          if (compact) {
            return (
              <NavLink
                key={item.id}
                to={item.children[0].to}
                title={item.label}
                className={cx(
                  'group mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-text-muted transition-all duration-200 hover:bg-blue/10 hover:text-blue',
                  groupActive && 'bg-blue/10 text-blue shadow-[inset_3px_0_0_0_#B6FF3B]',
                )}
              >
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            )
          }
          return (
            <div key={item.id}>
              <button type="button" onClick={() => toggleGroup(item.id)} title={compact ? item.label : undefined} aria-expanded={!compact && Boolean(open)} className={cx(
                'group flex w-full items-center rounded-xl font-medium transition-all duration-200',
                compact ? 'mx-auto h-11 w-11 justify-center text-text-muted hover:bg-blue/10 hover:text-blue' : 'gap-3 px-3 py-2.5 text-sm text-text-secondary hover:bg-white/[0.04] hover:text-text-primary',
                groupActive && 'bg-blue/10 text-blue',
              )}>
                {!compact && <><span className="flex-1 text-left">{item.label}</span><ChevronDown size={15} className={cx('transition-transform duration-200', open && 'rotate-180')} /></>}
              </button>

              {!compact && (
                <div className={cx('grid transition-[grid-template-rows,opacity] duration-200 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                  <div className="overflow-hidden">
                    <div className="ml-5 mt-1 space-y-1 border-l border-border-subtle pb-1 pl-3">
                      {item.children.map((child) => (
                        <NavLink key={child.to} to={child.to} onClick={onNavigate} className={({ isActive }) => cx(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-text-muted transition-all duration-200 hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-text-primary',
                          isActive && 'bg-blue/10 font-semibold text-blue',
                        )}>
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {!premium && (
        <div className={cx('shrink-0 pb-3', compact && 'px-1')}>
          <Link to="/pricing" onClick={onNavigate} title={compact ? 'Upgrade to Premium' : undefined} className={cx(
            'block rounded-xl border border-blue/25 bg-gradient-to-br from-blue/15 to-cyan/10 transition-all duration-200 hover:border-blue/45 hover:shadow-sm',
            compact ? 'mx-auto flex h-11 w-11 items-center justify-center' : 'p-3.5',
          )}>
            {compact ? <span className="text-[10px] font-semibold text-cyan">PRO</span> : <><div className="text-xs font-semibold text-text-primary">Upgrade to Premium</div><p className="mt-1 text-[11px] text-text-muted">Unlock unlimited video interviews &amp; scans.</p></>}
          </Link>
        </div>
      )}

      <div className={cx('shrink-0 border-t border-border-subtle py-4', compact ? 'space-y-2' : 'space-y-1')}>
        <button type="button" onClick={logoutAndClose} title={compact ? 'Logout' : undefined} className={cx('flex items-center rounded-xl text-text-muted transition-all duration-200 hover:bg-error/10 hover:text-error', compact ? 'mx-auto h-11 w-11 justify-center' : 'w-full gap-3 px-3 py-2.5 text-sm font-medium')}>
          {!compact && <span>Logout</span>}
        </button>
        <Link to="/app/profile" onClick={onNavigate} title={compact ? user?.fullName : undefined} className={cx('flex items-center gap-2.5 rounded-xl bg-white/[0.035] transition-colors duration-200 hover:bg-white/[0.06]', compact ? 'mx-auto h-11 w-11 justify-center' : 'mt-2 px-3 py-3')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue to-cyan text-[11px] font-semibold text-black">{user?.fullName?.[0] || 'U'}</div>
          {!compact && <><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-text-primary">{user?.fullName}</p><p className="truncate text-[11px] text-text-muted">{user?.targetCareer}</p></div><PlanBadge plan={user?.plan} /></>}
        </Link>
      </div>
    </div>
  )
}
