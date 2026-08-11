import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Lock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { useAuth } from '../../hooks/useAuth'
import * as billingService from '../../services/billingService'

export default function Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const planId = params.get('plan') || 'basic'
  const billingCycle = params.get('cycle') === 'year' ? 'year' : 'month'
  const sessionId = params.get('session_id')
  const orderId = params.get('order_id')
  const paymentResult = params.get('payment')
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [billing, setBilling] = useState({ phone: '', address: '', city: '' })
  const plan = plans.find((item) => item.id.toLowerCase() === planId.toLowerCase())

  useEffect(() => { billingService.getPlans().then(setPlans) }, [])
  useEffect(() => {
    if (paymentResult !== 'success' || !sessionId) return
    setLoading(true)
    billingService.getCheckoutStatus(sessionId)
      .then(async (status) => {
        if (!status.subscriptionActive) throw new Error('Payment is confirmed but activation is still processing. Refresh in a moment.')
        const current = await billingService.getCurrentSubscription()
        updateUser({ plan: current.plan.code.toLowerCase(), planRenewsAt: current.renewsAt })
        setVerified(true)
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [paymentResult, sessionId, updateUser])

  useEffect(() => {
    if (paymentResult !== 'return' || !orderId) return
    setLoading(true)
    let attempts = 0
    const verify = async () => {
      attempts += 1
      try {
        const status = await billingService.getPayHereOrderStatus(orderId)
        if (['failed', 'cancelled', 'chargeback'].includes(status.paymentStatus)) {
          navigate(`/app/checkout?payment=${status.paymentStatus === 'cancelled' ? 'cancelled' : 'failed'}&order_id=${encodeURIComponent(orderId)}`, { replace: true })
          setLoading(false)
          return
        }
        if (!status.subscriptionActive) {
          if (attempts < 6) return setTimeout(verify, 1500)
          throw new Error('PayHere is still confirming this payment. Refresh this page in a moment.')
        }
        const current = await billingService.getCurrentSubscription()
        updateUser({ plan: current.plan.code.toLowerCase(), planRenewsAt: current.renewsAt })
        setVerified(true)
        setLoading(false)
      } catch (error) {
        toast.error(error.message)
        setLoading(false)
      }
    }
    verify()
  }, [paymentResult, orderId, updateUser, navigate])

  async function beginCheckout() {
    if (!billing.phone.trim() || !billing.address.trim() || !billing.city.trim()) {
      toast.error('Phone, address, and city are required by PayHere.')
      return
    }
    setLoading(true)
    try {
      const session = await billingService.createPayHereCheckout({ planId, billingCycle, ...billing })
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = session.checkoutUrl
      Object.entries(session.fields).forEach(([name, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      toast.error(error.message || 'Unable to start secure checkout.')
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-5"><CheckCircle2 size={28} /></div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Payment confirmed</h1>
        <p className="text-sm text-text-muted mt-2">Your subscription is active.</p>
        <Button className="mt-6" onClick={() => navigate('/app/dashboard')}>Go to dashboard</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="font-display font-bold text-2xl text-text-primary mb-1">Upgrade to {plan?.name || 'Basic'}</h1>
      {paymentResult === 'cancelled' && (
        <div className="my-4 flex items-center gap-2 text-warning"><XCircle size={18} />Payment was cancelled. You were not charged.</div>
      )}
      {paymentResult === 'failed' && (
        <div className="my-4 flex items-center gap-2 text-error"><XCircle size={18} />Payment failed. Your subscription was not changed.</div>
      )}
      <Card className="mt-6">
        <p className="field-label mb-3">Order summary</p>
        {plan && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{plan.name} {billingCycle === 'year' ? 'yearly' : 'monthly'} plan</span>
              <Badge tone="blue">Rs.{(billingCycle === 'year' ? plan.annualPrice : plan.price).toLocaleString()}/{billingCycle === 'year' ? 'year' : 'month'}</Badge>
            </div>
            <ul className="mt-4 space-y-2">
              {plan.features.slice(0, 5).map((feature) => (
                <li key={feature} className="text-xs text-text-muted flex gap-2"><CheckCircle2 size={13} className="text-success shrink-0" />{feature}</li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-6 grid gap-4">
          <div>
            <label className="field-label" htmlFor="billing-phone">Billing phone</label>
            <input id="billing-phone" className="input-field mt-1" type="tel" autoComplete="tel"
              value={billing.phone} onChange={(event) => setBilling({ ...billing, phone: event.target.value })} />
          </div>
          <div>
            <label className="field-label" htmlFor="billing-address">Billing address</label>
            <input id="billing-address" className="input-field mt-1" autoComplete="street-address"
              value={billing.address} onChange={(event) => setBilling({ ...billing, address: event.target.value })} />
          </div>
          <div>
            <label className="field-label" htmlFor="billing-city">City</label>
            <input id="billing-city" className="input-field mt-1" autoComplete="address-level2"
              value={billing.city} onChange={(event) => setBilling({ ...billing, city: event.target.value })} />
          </div>
          <p className="text-[11px] text-text-disabled">These details are requested only for PayHere checkout and are not added to registration.</p>
        </div>
        <Button fullWidth className="mt-6" loading={loading} icon={Lock} onClick={beginCheckout}>
          Continue to secure payment
        </Button>
        <p className="text-[11px] text-text-disabled flex items-center gap-1.5 justify-center mt-3">
          <ShieldCheck size={12} />Card details are collected securely by PayHere and never touch Interview IQ servers.
        </p>
        <Link to="/pricing" className="text-xs text-blue hover:text-cyan mt-4 inline-block">← Choose a different plan</Link>
      </Card>
    </div>
  )
}
