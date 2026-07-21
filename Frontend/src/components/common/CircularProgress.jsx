export default function CircularProgress({ value = 0, size = 96, strokeWidth = 8, label }) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  const color = value >= 80 ? 'var(--color-success)' : value >= 60 ? 'var(--color-blue)' : value >= 40 ? 'var(--color-warning)' : 'var(--color-error)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-lg text-text-primary">{Math.round(value)}</span>
        {label && <span className="text-[9px] text-text-muted uppercase tracking-wide">{label}</span>}
      </div>
    </div>
  )
}
