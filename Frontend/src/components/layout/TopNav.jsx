import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, Search, Zap, User, Settings, LifeBuoy, LogOut } from 'lucide-react'
import Dropdown, { DropdownItem } from '../common/Dropdown'
import NotificationDrawer from './NotificationDrawer'
import { useAuth } from '../../hooks/useAuth'
import * as notificationService from '../../services/notificationService'

export default function TopNav({ title, onMenuClick }) {
  const { user, logout } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    notificationService.getNotifications().then((list) => setUnread(list.filter((n) => !n.read).length))
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-16 bg-topnav/90 backdrop-blur-md border-b border-border-subtle">
        <button onClick={onMenuClick} className="btn-icon lg:hidden"><Menu size={20} /></button>
        <h2 className="font-display font-semibold text-text-primary text-base hidden sm:block">{title}</h2>

        <div className="flex-1 max-w-sm ml-auto hidden md:block">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input placeholder="Search..." className="field pl-9 !py-2 text-sm" />
          </div>
        </div>

        <Link to="/app/interviews/setup" className="btn-coral !py-2 !px-3.5 text-xs hidden sm:inline-flex">
          <Zap size={14} /> Quick Interview
        </Link>

        <button onClick={() => setNotifOpen(true)} className="btn-icon relative" aria-label="Notifications">
          <Bell size={18} />
          {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral" />}
        </button>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 pl-1 pr-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-cyan flex items-center justify-center text-[11px] font-semibold text-white">
                {user?.fullName?.[0] || 'U'}
              </div>
            </button>
          }
        >
          <div className="px-3 py-2 mb-1 border-b border-border-subtle">
            <p className="text-sm font-medium text-text-primary truncate">{user?.fullName}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
          <Link to="/app/profile"><DropdownItem icon={User}>View Profile</DropdownItem></Link>
          <Link to="/app/settings"><DropdownItem icon={Settings}>Settings</DropdownItem></Link>
          <DropdownItem icon={LifeBuoy}>Help</DropdownItem>
          <DropdownItem icon={LogOut} onClick={logout}>Logout</DropdownItem>
        </Dropdown>
      </header>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  )
}
