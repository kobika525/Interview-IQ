import { Crown, Sparkles } from 'lucide-react'
import Badge from '../common/Badge'

export default function PlanBadge({ plan }) {
  if (plan === 'pro') return <Badge tone="coral"><Crown size={11} />Pro</Badge>
  if (plan === 'premium') return <Badge tone="cyan"><Sparkles size={11} />Premium</Badge>
  return <Badge>Free</Badge>
}
