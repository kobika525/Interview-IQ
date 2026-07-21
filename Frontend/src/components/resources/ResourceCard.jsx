import { Bookmark, CheckCircle2, ExternalLink } from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function ResourceCard({ resource, onBookmark }) {
  return (
    <Card hover className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          <Badge tone="blue">{resource.type}</Badge>
          <Badge>{resource.difficulty}</Badge>
          {resource.recommended && <Badge tone="cyan">Recommended</Badge>}
          {resource.completed && <Badge tone="success"><CheckCircle2 size={11} />Completed</Badge>}
        </div>
        <button onClick={() => onBookmark?.(resource.id)} aria-label="Bookmark" className="text-text-muted hover:text-cyan transition-colors shrink-0">
          <Bookmark size={16} fill={resource.bookmarked ? 'currentColor' : 'none'} className={resource.bookmarked ? 'text-cyan' : ''} />
        </button>
      </div>
      <h3 className="font-display font-semibold text-text-primary mt-3">{resource.title}</h3>
      <p className="text-sm text-text-muted mt-1.5 flex-1">{resource.description}</p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle text-xs text-text-muted">
        <span>{resource.provider} · {resource.duration}</span>
        <Button variant="ghost" icon={ExternalLink} className="!px-3 !py-1.5">Open</Button>
      </div>
    </Card>
  )
}
