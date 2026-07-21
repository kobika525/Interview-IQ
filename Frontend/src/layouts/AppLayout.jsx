import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from '../components/layout/Sidebar'
import TopNav from '../components/layout/TopNav'
import { X } from 'lucide-react'

const TITLES = {
  '/app/dashboard': 'Dashboard',
  '/app/resume-analyzer': 'Resume Analyzer',
  '/app/resume-history': 'Resume History',
  '/app/career-guidance': 'Career Guidance',
  '/app/skill-gap-analysis': 'Skill Gap Analysis',
  '/app/interviews': 'Mock Interviews',
  '/app/interviews/setup': 'Interview Setup',
  '/app/interviews/history': 'Interview History',
  '/app/learning-roadmap': 'Learning Roadmap',
  '/app/resources': 'Learning Resources',
  '/app/progress': 'Progress Tracking',
  '/app/notifications': 'Notifications',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
  '/app/subscription': 'Subscription',
  '/app/billing': 'Billing',
  '/app/checkout': 'Checkout',
  '/app/support': 'Support',
}

function pageTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname]
  if (pathname.startsWith('/app/interviews/text')) return 'Text Interview'
  if (pathname.startsWith('/app/interviews/voice')) return 'Voice Interview'
  if (pathname.startsWith('/app/interviews/video')) return 'Video Interview'
  if (pathname.startsWith('/app/interviews/report')) return 'Interview Report'
  return 'Interview IQ'
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-app text-text-primary flex">
      {/* Desktop sidebar — compact icon-only rail */}
      <aside className="hidden lg:block w-20 shrink-0 border-r border-border-subtle">
        <div className="fixed w-20 h-screen"><Sidebar compact /></div>
      </aside>

      {/* Mobile drawer sidebar */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.22 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              <div className="relative h-full">
                <button onClick={() => setDrawerOpen(false)} className="btn-icon absolute top-4 right-3 z-10"><X size={18} /></button>
                <Sidebar onNavigate={() => setDrawerOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav title={pageTitle(location.pathname)} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
