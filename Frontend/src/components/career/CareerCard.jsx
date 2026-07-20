import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import Card from '../common/Card'
import CircularProgress from '../common/CircularProgress'
import SkillTag from '../common/SkillTag'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function CareerCard({ career }) {
  return (
    <Card hover>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-text-primary">{career.title}</h3>
          <p className="text-sm text-text-muted mt-1">{career.summary}</p>
        </div>
        <CircularProgress value={career.match} size={64} strokeWidth={6} label="match" />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {career.matchedSkills.map((s) => <SkillTag key={s} tone="matched">{s}</SkillTag>)}
        {career.missingSkills.map((s) => <SkillTag key={s} tone="missing">{s}</SkillTag>)}
      </div>

      <div className="flex items-center gap-3 mt-4 text-xs text-text-muted">
        <Badge tone={career.demand === 'High' ? 'success' : 'warning'}><TrendingUp size={11} />{career.demand} demand</Badge>
        <span>{career.duration}</span>
        <span>·</span>
        <span>{career.difficulty}</span>
      </div>

      <div className="flex gap-2.5 mt-5 pt-4 border-t border-border-subtle">
        <Link to="/app/learning-roadmap" className="flex-1"><Button variant="outline" fullWidth>Roadmap</Button></Link>
        <Link to="/app/interviews/setup" className="flex-1"><Button fullWidth>Start interview</Button></Link>
      </div>
    </Card>
  )
}
