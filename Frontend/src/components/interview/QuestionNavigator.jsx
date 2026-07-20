import { cx } from '../../utils/helpers'

export default function QuestionNavigator({ total, current, answered = [], flagged = [], onSelect }) {
  return (
    <div>
      <p className="field-label mb-2">Question navigator</p>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const isAnswered = answered.includes(i)
          const isFlagged = flagged.includes(i)
          const isCurrent = current === i
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={cx(
                'h-9 rounded-lg text-xs font-semibold border transition-colors relative',
                isCurrent && 'border-blue text-blue bg-blue/10',
                !isCurrent && isAnswered && 'border-success/30 text-success bg-success/5',
                !isCurrent && !isAnswered && 'border-border text-text-muted'
              )}
            >
              {i + 1}
              {isFlagged && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning" />}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" />Answered</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning" />Flagged</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-border" />Unanswered</span>
      </div>
    </div>
  )
}
