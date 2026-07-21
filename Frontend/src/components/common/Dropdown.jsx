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

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className={cx('absolute top-full mt-2 z-40 surface-card-elevated p-2', align === 'right' ? 'right-0' : 'left-0', width)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownItem({ icon: Icon, children, ...rest }) {
  return (
    <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-black/[0.045] hover:text-text-primary transition-colors text-left" {...rest}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}
