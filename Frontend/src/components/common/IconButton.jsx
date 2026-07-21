import { cx } from '../../utils/helpers'

export default function IconButton({ icon: Icon, label, className = '', active = false, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx('btn-icon', active && 'bg-blue/10 text-blue', className)}
      {...rest}
    >
      <Icon size={18} />
    </button>
  )
}
