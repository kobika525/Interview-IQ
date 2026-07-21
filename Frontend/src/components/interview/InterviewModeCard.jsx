import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function InterviewModeCard({ icon: Icon, title, description, duration, features, to, tone = 'blue', locked = false, onLockedClick }) {
  const chip = { blue: 'bg-blue/10 text-blue', cyan: 'bg-cyan/10 text-cyan', coral: 'bg-coral/10 text-coral' }
  return (
    <Card hover className="flex flex-col relative">
      {locked && <Badge tone="coral" className="absolute top-5 right-5"><Lock size={10} />Premium</Badge>}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${chip[tone]}`}>
        <Icon size={22} />
      </div>
      <h3 className="font-display font-semibold text-lg text-text-primary mt-4">{title}</h3>
      <p className="text-sm text-text-muted mt-1.5">{description}</p>
      <div className="flex flex-wrap gap-1.5 mt-4">
        {features.map((f) => <Badge key={f}>{f}</Badge>)}
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-subtle">
        <span className="text-xs text-text-muted">{duration}</span>
        {locked ? (
          <Button variant="outline" onClick={onLockedClick}>Unlock</Button>
        ) : (
          <Link to={to}><Button>Start</Button></Link>
        )}
      </div>
    </Card>
  )
}
