import { cx } from '../../utils/helpers'

export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={cx('flex items-center gap-1 border-b border-border-subtle overflow-x-auto', className)}>
      {tabs.map((tab) => {
        const isActive = active === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cx(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
              isActive ? 'border-blue text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
