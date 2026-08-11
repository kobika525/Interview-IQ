import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cx } from '../../utils/helpers'

export default function Dropdown({ trigger, children, align = 'right', width = 'w-56' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            role="menu"
            className={cx(
              'absolute top-full mt-2 z-40 overflow-hidden rounded-xl border border-border bg-card-elevated/95 p-1.5 backdrop-blur-xl shadow-[0_18px_55px_-20px_rgba(0,0,0,0.95),0_0_24px_-14px_rgba(182,255,59,0.35)]',
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left', width
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownItem({ icon: Icon, children, className = '', ...rest }) {
  return (
    <button type="button" role="menuitem" className={cx('group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-transparent text-sm text-text-secondary hover:border-blue/15 hover:bg-blue/10 hover:text-blue focus-visible:outline-none focus-visible:border-blue/40 focus-visible:bg-blue/10 transition-colors text-left', className)} {...rest}>
      {Icon && <Icon size={16} className="text-text-muted transition-colors group-hover:text-blue" />}
      {children}
    </button>
  )
}
