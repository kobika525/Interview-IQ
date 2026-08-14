import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cx } from '../../utils/helpers'

const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    placeholder = 'Select...',
    className = '',
    containerClassName = '',
    id,
    value,
    defaultValue = '',
    onChange,
    onBlur,
    name,
    disabled,
    required,
    ...rest
  },
  ref,
) {
  const inputId = id || name
  const selectRef = useRef(null)
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const selectedValue = value !== undefined ? value : internalValue

  useImperativeHandle(ref, () => selectRef.current)

  const normalizedOptions = useMemo(
    () => options.map((option) => ({
      value: String(option?.value ?? option),
      label: option?.label ?? option,
    })),
    [options],
  )

  const selectedOption = normalizedOptions.find((option) => option.value === String(selectedValue ?? ''))

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const choose = (nextValue) => {
    if (value === undefined) setInternalValue(nextValue)
    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
      type: 'change',
    })
    setOpen(false)
  }

  const handleKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((current) => !current)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const currentIndex = normalizedOptions.findIndex((option) => option.value === String(selectedValue ?? ''))
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = Math.min(normalizedOptions.length - 1, Math.max(0, currentIndex + direction))
      if (normalizedOptions[nextIndex]) choose(normalizedOptions[nextIndex].value)
    }
  }

  return (
    <div className={containerClassName} ref={rootRef}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}

      <select
        ref={selectRef}
        id={inputId}
        name={name}
        value={selectedValue ?? ''}
        onChange={(event) => choose(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        {...rest}
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <div className="group relative">
        <button
          type="button"
          role="combobox"
          aria-controls={`${inputId}-options`}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-required={required}
          disabled={disabled}
          onBlur={onBlur}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleKeyDown}
          className={cx(
            'field themed-select flex items-center justify-between pr-2.5 text-left cursor-pointer',
            error && 'border-error',
            disabled && 'cursor-not-allowed text-text-disabled opacity-60',
            className,
          )}
        >
          <span className={selectedOption ? 'text-text-primary' : 'text-text-muted'}>
            {selectedOption?.label ?? placeholder}
          </span>
          <span className={cx(
            'ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors',
            open
              ? 'border-button-green/50 bg-button-green/10 text-button-green'
              : 'border-border-subtle bg-card-2 text-text-muted group-hover:border-button-green/30 group-hover:text-button-green',
          )}>
            <ChevronDown size={15} strokeWidth={2.25} className={cx('transition-transform', open && 'rotate-180')} />
          </span>
        </button>

        {open && !disabled && (
          <div
            id={`${inputId}-options`}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card-elevated p-1.5 shadow-[0_18px_55px_-20px_rgba(0,0,0,0.95)]"
          >
            <button
              type="button"
              role="option"
              aria-selected={String(selectedValue ?? '') === ''}
              onClick={() => choose('')}
              className={cx(
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                String(selectedValue ?? '') === ''
                  ? 'bg-button-green text-black'
                  : 'text-text-secondary hover:bg-button-green hover:text-black',
              )}
            >
              <span>{placeholder}</span>
              {String(selectedValue ?? '') === '' && <Check size={15} />}
            </button>
            {normalizedOptions.map((option) => {
              const active = option.value === String(selectedValue ?? '')
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  key={option.value}
                  onClick={() => choose(option.value)}
                  className={cx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    active
                      ? 'bg-button-green text-black'
                      : 'text-text-primary hover:bg-button-green hover:text-black',
                  )}
                >
                  <span>{option.label}</span>
                  {active && <Check size={15} />}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
})

export default Select
