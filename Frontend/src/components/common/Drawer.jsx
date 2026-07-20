import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function Drawer({ open, onClose, title, children, side = 'right', width = 'max-w-sm' }) {
  if (typeof document === 'undefined') return null
  const x = side === 'right' ? { closed: '100%', open: 0 } : { closed: '-100%', open: 0 }
  const sideClass = side === 'right' ? 'right-0' : 'left-0'
  const borderClass = side === 'right' ? 'border-l border-border-subtle' : 'border-r border-border-subtle'

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ x: x.closed }} animate={{ x: x.open }} exit={{ x: x.closed }}
            transition={{ type: 'tween', duration: 0.25 }}
            className={`fixed top-0 ${sideClass} h-full w-full ${width} bg-app-2 ${borderClass} z-50 flex flex-col`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <h3 className="font-display font-semibold text-text-primary">{title}</h3>
              <button onClick={onClose} aria-label="Close" className="btn-icon"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
