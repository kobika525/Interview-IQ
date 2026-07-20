import CircularProgress from '../common/CircularProgress'

export default function ResumeScoreRing({ score, size = 120 }) {
  return (
    <div className="flex items-center gap-5">
      <CircularProgress value={score} size={size} strokeWidth={10} />
      <div>
        <p className="font-display font-semibold text-text-primary">ATS Score</p>
        <p className="text-sm text-text-muted mt-1">
          {score >= 80 ? 'Excellent — above average for most roles.' : score >= 60 ? 'Good — a few improvements will help.' : 'Needs work — follow the suggestions below.'}
        </p>
      </div>
    </div>
  )
}
