import { Link } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { cx } from '../../utils/helpers'

export default function PricingCard({ plan, currentPlan, billingCycle = 'month' }) {
  const isCurrent = currentPlan === plan.id
  const price = plan.price === 0 ? 0 : billingCycle === 'year' ? plan.annualPrice : plan.price

  return (
    <Card
      elevated={plan.highlight}
      hover
      className={cx(
        'flex min-h-[520px] flex-col relative !rounded-[2rem] !px-7 !py-8 sm:!px-8',
        plan.highlight && 'border-blue/40 glow-border md:-translate-y-3'
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-gradient-to-r from-blue to-cyan text-white">
          <Sparkles size={11} />Most popular
        </span>
      )}
      <div className="text-center pt-2">
        <h3 className="font-display font-bold text-xl text-text-primary">{plan.name}</h3>
        <p className="text-sm text-text-muted mt-1 min-h-5">{plan.tagline}</p>
      </div>
      <div className="mt-5 flex items-end justify-center gap-1">
        <span className="font-display font-extrabold text-5xl tracking-tight text-text-primary">Rs.{price.toLocaleString()}</span>
        {plan.price > 0 && <span className="text-sm text-text-muted mb-1.5">/{billingCycle === 'year' ? 'yr' : 'mo'}</span>}
      </div>
      <div className="mx-auto mt-6 h-px w-3/4 bg-gradient-to-r from-transparent via-border to-transparent" />
      <ul className="mt-7 space-y-4 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm leading-5 text-text-secondary">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check size={13} strokeWidth={3} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        {isCurrent ? (
          <Badge tone="success" className="w-full justify-center !py-3.5 !text-xs">Current plan</Badge>
        ) : plan.id === 'free' ? (
          <Link to="/register"><Button variant="outline" fullWidth className="!rounded-xl !py-3.5">Get started free</Button></Link>
        ) : (
          <Link to={`/app/checkout?plan=${plan.id}&cycle=${billingCycle}`}><Button fullWidth className="!rounded-xl !py-3.5">Upgrade to {plan.name}</Button></Link>
        )}
      </div>
    </Card>
  )
}
