import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import AdminSidebar from '../components/layout/AdminSidebar'

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen bg-app text-text-primary flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border-subtle">
        <div className="fixed w-64 h-screen"><AdminSidebar /></div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-72 h-full">
            <button onClick={() => setOpen(false)} className="btn-icon absolute top-4 right-3 z-10"><X size={18} /></button>
            <AdminSidebar />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-16 bg-topnav/90 backdrop-blur-md border-b border-border-subtle">
          <button onClick={() => setOpen(true)} className="btn-icon lg:hidden"><Menu size={20} /></button>
          <h2 className="font-display font-semibold text-text-primary">Admin Console</h2>
        </header>
        <main className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
