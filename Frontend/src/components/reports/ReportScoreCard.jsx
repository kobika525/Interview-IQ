import ScoreCard from '../common/ScoreCard'

export default function ReportScoreCard({ scores }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-5">
      {scores.filter((s) => s.value !== null && s.value !== undefined).map((s) => (
        <ScoreCard key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  )
}
