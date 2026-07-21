import CircularProgress from './CircularProgress'

export default function ScoreCard({ label, value, size = 88 }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <CircularProgress value={value} size={size} />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  )
}
