import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Card from '../common/Card'
import SkillTag from '../common/SkillTag'
import Badge from '../common/Badge'
import { scoreTone } from '../../utils/formatters'

export default function QuestionBreakdownCard({ item, index }) {
  const [open, setOpen] = useState(index === 0)
  const tone = scoreTone(item.score)

  return (
    <Card className="!p-0 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-4 p-4 text-left">
        <div className="min-w-0">
          <p className="text-xs text-text-muted">Question {index + 1}</p>
          <p className="text-sm text-text-primary font-medium truncate">{item.question}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge tone={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'error'}>{item.score}/100</Badge>
          <ChevronDown size={16} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-5 pt-1 border-t border-border-subtle space-y-4">
          <div>
            <p className="field-label">Your answer</p>
            <p className="text-sm text-text-secondary">{item.userAnswer}</p>
          </div>
          <div>
            <p className="field-label">AI feedback</p>
            <p className="text-sm text-text-secondary">{item.feedback}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.matchedKeywords.map((k) => <SkillTag key={k} tone="matched">{k}</SkillTag>)}
            {item.missingKeywords.map((k) => <SkillTag key={k} tone="missing">{k}</SkillTag>)}
          </div>
          <div>
            <p className="field-label">Model answer</p>
            <p className="text-sm text-text-muted">{item.modelAnswer}</p>
          </div>
          <div className="rounded-xl bg-blue/5 border border-blue/20 p-3">
            <p className="text-xs text-blue font-medium">Suggestion</p>
            <p className="text-sm text-text-secondary mt-1">{item.suggestion}</p>
          </div>
        </div>
      )}
    </Card>
  )
}
