import { Link } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { cx } from '../../utils/helpers'

export default function PricingCard({ plan, currentPlan, billingCycle = 'month', layout = 'default' }) {
  const isCurrent = currentPlan === plan.id
  const price = plan.price === 0 ? 0 : billingCycle === 'year' ? plan.annualPrice : plan.price
  const compact = layout === 'subscription'

  if (compact) {
    const featured = plan.highlight
    return (
      <Card
        className={cx(
          'group relative flex min-h-[570px] flex-col overflow-hidden !rounded-[2.75rem] !p-7 transition-all duration-300 lg:!p-8',
          'hover:-translate-y-2 hover:shadow-[0_30px_70px_-28px_rgba(182,255,59,0.28)]',
          featured
            ? '!border-blue/45 !bg-card-elevated shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)] md:-translate-y-3'
            : '!border-border !bg-card-elevated shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]',
        )}
      >
        {featured && (
          <span className="absolute right-5 top-5 badge bg-blue/10 text-blue">
            <Sparkles size={11} />Popular
          </span>
        )}

        <div className="relative text-center pt-3">
          <h3 className="font-display text-xl font-bold text-text-primary">{plan.name}</h3>
          <p className="mt-1 min-h-5 text-xs text-text-muted">{plan.tagline}</p>
        </div>

        <div className="relative mt-5 flex items-end justify-center gap-1">
          <span className="font-display text-5xl font-extrabold tracking-tight text-blue">
            {price === 0 ? 'Free' : `Rs.${price.toLocaleString()}`}
          </span>
          {plan.price > 0 && (
            <span className="mb-1.5 text-xs font-semibold text-text-muted">
              /{billingCycle === 'year' ? 'yr' : 'mo'}
            </span>
          )}
        </div>

        <p className="mt-2 text-center text-[10px] text-text-muted">
          {plan.price === 0 ? 'Start with essential features' : `Billed per ${billingCycle === 'year' ? 'year' : 'month'}`}
        </p>

        <div className="mx-auto mt-6 h-px w-3/4 bg-gradient-to-r from-transparent via-blue/45 to-transparent" />

        <p className="relative mt-7 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">What&apos;s included</p>
        <ul className="relative mt-5 flex-1 space-y-4">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm leading-5 text-text-secondary">
              <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue text-black"><Check size={13} strokeWidth={3.5} /></span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="relative mt-8">
          {isCurrent ? (
            <div className="flex w-full items-center justify-center rounded-2xl border border-blue/35 bg-blue/10 py-3.5 text-sm font-bold text-blue">Current plan</div>
          ) : plan.id === 'free' ? (
            <Link to="/register"><Button variant="outline" fullWidth className="!rounded-2xl !py-3.5">Select plan</Button></Link>
          ) : (
            <Link to={`/app/checkout?plan=${plan.id}&cycle=${billingCycle}`}>
              <Button fullWidth className="!rounded-2xl !py-3.5">Select plan</Button>
            </Link>
          )}
          <p className="mt-3 text-center text-[10px] text-text-muted">
            {plan.price === 0 ? '(No credit card required)' : '(Cancel or change anytime)'}
          </p>
        </div>
      </Card>
    )
  }

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
