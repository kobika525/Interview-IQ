import { forwardRef } from 'react'
import { cx } from '../../utils/helpers'

const Input = forwardRef(function Input(
  { label, error, icon: Icon, className = '', containerClassName = '', id, ...rest }, ref
) {
  const inputId = id || rest.name
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cx('field', Icon && 'pl-10', error && 'border-error focus:border-error focus:ring-error/20', className)}
          {...rest}
        />
      </div>
      {error && <p id={`${inputId}-error`} className="field-error">{error}</p>}
    </div>
  )
})

export default Input
