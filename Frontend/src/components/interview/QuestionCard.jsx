import Badge from '../common/Badge'
import { Sparkles } from 'lucide-react'

const DIFF_TONE = { Easy: 'success', Medium: 'warning', Hard: 'error' }

export default function QuestionCard({ question, index, total }) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue to-cyan flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-text-primary" />
        </div>
        <div>
          <p className="text-xs text-text-muted">AI Interviewer · Question {index + 1} of {total}</p>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <Badge tone={DIFF_TONE[question.difficulty] || 'neutral'}>{question.difficulty}</Badge>
        <Badge tone="blue">{question.topic}</Badge>
        <Badge>{question.type}</Badge>
      </div>
      <p className="text-base text-text-primary leading-relaxed">{question.question}</p>
    </div>
  )
}
