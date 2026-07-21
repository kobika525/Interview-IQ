import { cx } from '../../utils/helpers'

export default function ProgressBar({ value = 0, tone = 'blue', className = '', height = 'h-1.5' }) {
  const colors = { blue: 'bg-blue', cyan: 'bg-cyan', coral: 'bg-coral', success: 'bg-success', warning: 'bg-warning' }
  return (
    <div className={cx('w-full rounded-full bg-black/[0.045] overflow-hidden', height, className)}>
      <div
        className={cx('h-full rounded-full transition-all duration-500', colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
