import { Link } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { cx } from '../../utils/helpers'

export default function PricingCard({ plan, currentPlan, billingCycle = 'month' }) {
  const isCurrent = currentPlan === plan.id
  const price = plan.price === 0 ? 0 : billingCycle === 'year' ? Math.round(plan.price * 10) : plan.price

  return (
    <Card
      elevated={plan.highlight}
      className={cx('flex flex-col relative', plan.highlight && 'border-blue/40 glow-border')}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-gradient-to-r from-blue to-cyan text-white">
          <Sparkles size={11} />Most popular
        </span>
      )}
      <h3 className="font-display font-semibold text-lg text-text-primary mt-2">{plan.name}</h3>
      <p className="text-sm text-text-muted mt-1">{plan.tagline}</p>
      <div className="mt-5 flex items-end gap-1">
        <span className="font-display font-extrabold text-4xl text-text-primary">${price}</span>
        {plan.price > 0 && <span className="text-sm text-text-muted mb-1">/{billingCycle === 'year' ? 'yr' : 'mo'}</span>}
      </div>
      <ul className="mt-6 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <Check size={15} className="text-success shrink-0 mt-0.5" />{f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {isCurrent ? (
          <Badge tone="success" className="w-full justify-center !py-2.5">Current plan</Badge>
        ) : plan.id === 'free' ? (
          <Link to="/register"><Button variant="outline" fullWidth>Get started free</Button></Link>
        ) : (
          <Link to={`/app/checkout?plan=${plan.id}`}><Button fullWidth>Upgrade to {plan.name}</Button></Link>
        )}
      </div>
    </Card>
  )
}
