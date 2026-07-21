import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CreditCard, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { useAuth } from '../../hooks/useAuth'
import * as billingService from '../../services/billingService'

export default function Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const planId = params.get('plan') || 'premium'

  const [plans, setPlans] = useState([])
  const [card, setCard] = useState({ name: user?.fullName || '', number: '', expiry: '', cvc: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { billingService.getPlans().then(setPlans) }, [])
  const plan = plans.find((p) => p.id === planId)

  function update(field, value) { setCard((c) => ({ ...c, [field]: value })) }

  function validate() {
    const e = {}
    if (!card.name.trim()) e.name = 'Name on card is required'
    if (card.number.replace(/\s/g, '').length < 12) e.number = 'Enter a valid card number'
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = 'Use MM/YY format'
    if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = 'Enter a valid CVC'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const result = await billingService.subscribe({ planId, card })
      updateUser({ plan: result.plan, planRenewsAt: result.renewsAt })
      setSuccess(true)
      toast.success(`You're now on the ${plan?.name} plan!`)
    } catch (err) {
      toast.error(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-5"><CheckCircle2 size={28} /></div>
        <h1 className="font-display font-bold text-2xl text-text-primary">You're upgraded!</h1>
        <p className="text-sm text-text-muted mt-2">Welcome to {plan?.name}. Unlimited scans and video interviews are now unlocked.</p>
        <Button className="mt-6" onClick={() => navigate('/app/dashboard')}>Go to dashboard</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="font-display font-bold text-2xl text-text-primary mb-1">Upgrade to {plan?.name || 'Premium'}</h1>
      <p className="text-sm text-text-muted mb-8">This is a demo checkout — no real payment is processed.</p>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={submit} className="md:col-span-2 space-y-4">
          <Card className="space-y-4">
            <p className="field-label !mb-0 flex items-center gap-2"><CreditCard size={14} />Card details</p>
            <Input label="Name on card" value={card.name} onChange={(e) => update('name', e.target.value)} error={errors.name} />
            <Input label="Card number" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => update('number', e.target.value)} error={errors.number} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Expiry" placeholder="MM/YY" value={card.expiry} onChange={(e) => update('expiry', e.target.value)} error={errors.expiry} />
              <Input label="CVC" placeholder="123" value={card.cvc} onChange={(e) => update('cvc', e.target.value)} error={errors.cvc} />
            </div>
            <Button type="submit" fullWidth loading={loading} icon={Lock}>Pay ${plan?.price ?? ''} & subscribe</Button>
            <p className="text-[11px] text-text-disabled flex items-center gap-1.5 justify-center"><ShieldCheck size={12} />Secure demo checkout — card details are never sent anywhere.</p>
          </Card>
        </form>

        <Card className="h-fit">
          <p className="field-label mb-3">Order summary</p>
          {plan && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{plan.name} plan</span>
                <Badge tone="blue">${plan.price}/mo</Badge>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="text-xs text-text-muted flex gap-2"><CheckCircle2 size={13} className="text-success shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
              <div className="border-t border-border-subtle mt-4 pt-4 flex justify-between text-sm">
                <span className="text-text-muted">Total due today</span>
                <span className="text-text-primary font-semibold">${plan.price}.00</span>
              </div>
            </>
          )}
          <Link to="/pricing" className="text-xs text-blue hover:text-cyan mt-4 inline-block">← Choose a different plan</Link>
        </Card>
      </div>
    </div>
  )
}
