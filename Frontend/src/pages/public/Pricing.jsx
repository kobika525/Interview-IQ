import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Badge from '../../components/common/Badge'
import PricingCard from '../../components/billing/PricingCard'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import { useAuth } from '../../hooks/useAuth'
import * as billingService from '../../services/billingService'

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes — cancel from Settings → Billing at any time. You keep access until the end of your current billing period.' },
  { q: 'What happens to my data if I downgrade?', a: 'Your resume analyses and interview history stay saved, but older reports beyond the Free plan limit become read-only until you upgrade again.' },
  { q: 'Do you offer a free trial of Premium?', a: 'The Free plan itself works as an ongoing trial — 3 resume scans and text/voice interviews, no time limit and no card required.' },
  { q: 'Is yearly billing available?', a: 'Yes, toggle "Billed yearly" above for a discount equivalent to two months free.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="surface-card p-5">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-4 text-left">
        <span className="font-medium text-text-primary text-sm">{q}</span>
        <ChevronDown size={16} className={`text-text-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-text-muted mt-3">{a}</p>}
    </div>
  )
}

export default function Pricing() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [cycle, setCycle] = useState('month')

  useEffect(() => { billingService.getPlans().then(setPlans) }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center max-w-xl mx-auto">
        <Badge tone="blue">Pricing</Badge>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-text-primary mt-4">Simple plans, real preparation</h1>
        <p className="text-text-secondary mt-3">Start free. Upgrade when you want unlimited practice and full video interviews.</p>

        <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-full bg-black/[0.045] border border-border-subtle">
          {['month', 'year'].map((c) => (
            <button
              key={c} onClick={() => setCycle(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${cycle === c ? 'bg-blue text-white' : 'text-text-muted'}`}
            >
              Billed {c === 'month' ? 'monthly' : 'yearly'} {c === 'year' && <span className="text-cyan">· save 2 months</span>}
            </button>
          ))}
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="mt-12"><SkeletonLoader rows={2} /></div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {plans.map((p) => <PricingCard key={p.id} plan={p} currentPlan={user?.plan} billingCycle={cycle} />)}
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-20">
        <h2 className="font-display font-bold text-2xl text-text-primary text-center mb-8">Pricing FAQ</h2>
        <div className="space-y-3">{FAQS.map((f) => <FAQItem key={f.q} {...f} />)}</div>
      </div>
    </div>
  )
}
