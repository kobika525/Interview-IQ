import { cx } from '../../utils/helpers'
import LoadingSpinner from './LoadingSpinner'

const VARIANTS = {
  coral: 'btn-coral',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
}

export default function Button({
  children, variant = 'coral', loading = false, disabled = false,
  fullWidth = false, type = 'button', className = '', icon: Icon, onClick, ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(VARIANTS[variant], fullWidth && 'w-full', 'text-sm inline-flex items-center justify-center gap-2', className)}
      {...rest}
    >
      {loading ? <LoadingSpinner size={16} /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  )
}
