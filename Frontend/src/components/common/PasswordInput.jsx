import { forwardRef, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { cx } from '../../utils/helpers'

const PasswordInput = forwardRef(function PasswordInput(
  { label, error, className = '', containerClassName = '', id, ...rest }, ref
) {
  const [visible, setVisible] = useState(false)
  const inputId = id || rest.name
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <div className="relative">
        <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          id={inputId}
          ref={ref}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          className={cx('field pl-10 pr-11', error && 'border-error focus:border-error focus:ring-error/20', className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
})

export default PasswordInput
