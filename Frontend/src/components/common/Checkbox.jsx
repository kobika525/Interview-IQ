import { Check } from 'lucide-react'

export default function Checkbox({ label, checked, onChange, error, ...rest }) {
  return (
    <div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-text-secondary">
        <span className="relative inline-flex">
          <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" {...rest} />
          <span className="w-5 h-5 rounded-md border border-border bg-input flex items-center justify-center peer-checked:bg-blue peer-checked:border-blue transition-colors">
            {checked && <Check size={13} className="text-text-primary" />}
          </span>
        </span>
        {label}
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
