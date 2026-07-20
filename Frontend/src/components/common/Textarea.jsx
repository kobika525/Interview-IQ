import { forwardRef } from 'react'
import { cx } from '../../utils/helpers'

const Textarea = forwardRef(function Textarea(
  { label, error, className = '', containerClassName = '', id, ...rest }, ref
) {
  const inputId = id || rest.name
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <textarea
        id={inputId}
        ref={ref}
        className={cx('field resize-none', error && 'border-error', className)}
        {...rest}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  )
})

export default Textarea
