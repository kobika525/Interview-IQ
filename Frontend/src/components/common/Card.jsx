import { motion } from 'framer-motion'
import { cx } from '../../utils/helpers'

export default function Card({ children, className = '', elevated = false, hover = false, as: As = 'div', ...rest }) {
  const Comp = motion[As] || motion.div
  return (
    <Comp
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cx(
        elevated ? 'surface-card-elevated' : 'surface-card',
        'p-5',
        hover && 'transition-transform hover:-translate-y-1 hover:border-blue/30',
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  )
}
