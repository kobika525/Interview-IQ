import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '../../utils/helpers'

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder = 'Select...', className = '', containerClassName = '', id, ...rest }, ref
) {
  const inputId = id || rest.name
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <div className="relative">
        <select
          id={inputId}
          ref={ref}
          className={cx('field appearance-none pr-9', error && 'border-error', className)}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
})

export default Select
