export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}
export function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
export function scoreTone(score) {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}
