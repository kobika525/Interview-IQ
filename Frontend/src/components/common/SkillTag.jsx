import { cx } from '../../utils/helpers'

export default function SkillTag({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-border text-text-secondary',
    matched: 'border-success/30 text-success bg-success/5',
    missing: 'border-error/30 text-error bg-error/5',
  }
  return (
    <span className={cx('inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}
