export default function Switch({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
      {label && <span className="text-sm text-text-secondary">{label}</span>}
      <span
        onClick={onChange}
        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${checked ? 'bg-blue justify-end' : 'bg-border justify-start'}`}
      >
        <span className="w-5 h-5 rounded-full bg-white shadow" />
      </span>
    </label>
  )
}
