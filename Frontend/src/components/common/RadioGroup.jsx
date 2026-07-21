export default function RadioGroup({ name, options, value, onChange, className = '' }) {
  return (
    <div className={className}>
      {options.map((opt) => {
        const val = opt.value ?? opt
        const lbl = opt.label ?? opt
        const active = value === val
        return (
          <label
            key={val}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors mb-2 ${
              active ? 'border-blue bg-blue/10 text-blue' : 'border-border text-text-secondary hover:border-border/80'
            }`}
          >
            <input type="radio" name={name} value={val} checked={active} onChange={() => onChange(val)} className="sr-only" />
            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-blue' : 'border-border'}`}>
              {active && <span className="w-2 h-2 rounded-full bg-blue" />}
            </span>
            {lbl}
          </label>
        )
      })}
    </div>
  )
}
