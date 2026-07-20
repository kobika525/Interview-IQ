import { cx } from '../../utils/helpers'

const TONES = {
  neutral: 'bg-black/[0.045] text-text-secondary',
  blue: 'bg-blue/10 text-blue',
  cyan: 'bg-cyan/10 text-cyan',
  coral: 'bg-coral/10 text-coral',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
}

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={cx('badge', TONES[tone], className)}>{children}</span>
}
