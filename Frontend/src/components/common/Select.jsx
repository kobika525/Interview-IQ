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
      <div className="group relative">
        <select
          id={inputId}
          ref={ref}
          className={cx('field themed-select appearance-none pr-12 cursor-pointer', error && 'border-error', className)}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border border-border-subtle bg-card-2 text-text-muted transition-colors group-hover:border-blue/30 group-hover:text-blue group-focus-within:border-blue/40 group-focus-within:bg-blue/10 group-focus-within:text-blue">
          <ChevronDown size={15} strokeWidth={2.25} />
        </span>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
})

export default Select
