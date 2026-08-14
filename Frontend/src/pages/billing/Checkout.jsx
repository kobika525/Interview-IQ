import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Check, CheckCircle2, CreditCard, Lock, ShieldCheck, Sparkles, XCircle } from 'lucide-react'
import Button from '../../components/common/Button'
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
  const amount = plan ? (billingCycle === 'year' ? plan.annualPrice : plan.price) : 0
  const cycleLabel = billingCycle === 'year' ? 'year' : 'month'

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
    <div className="max-w-5xl mx-auto py-6 sm:py-10">
      {paymentResult === 'cancelled' && <div className="mb-4 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 flex items-center gap-2 text-sm text-warning"><XCircle size={18} />Payment was cancelled. You were not charged.</div>}
      {paymentResult === 'failed' && <div className="mb-4 rounded-xl border border-error/25 bg-error/10 px-4 py-3 flex items-center gap-2 text-sm text-error"><XCircle size={18} />Payment failed. Your subscription was not changed.</div>}

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_28px_90px_-35px_rgba(182,255,59,0.22)] grid lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative min-h-[390px] overflow-hidden border-b lg:border-b-0 lg:border-r border-border bg-[#090b08] p-7 sm:p-10 flex flex-col justify-between">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-blue/10 blur-3xl" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(182,255,59,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(182,255,59,.06)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue/20 bg-blue/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue"><Sparkles size={13} /> Interview IQ Premium</div>
            <h1 className="mt-5 max-w-sm font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">Invest in your next opportunity.</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-text-muted">Practice smarter with AI-powered feedback built to help you interview with confidence.</p>
          </div>
          <div className="relative z-10 mt-6 h-52 w-full sm:h-56 lg:mt-0 lg:flex-1 lg:min-h-[300px] [perspective:900px]" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 w-[82%] max-w-xs rounded-2xl border border-blue/25 bg-gradient-to-br from-[#1b2415] to-[#0d100c] p-5 shadow-2xl [transform:translate(-50%,-75%)_rotate(-5deg)_rotateX(55deg)]">
              <div className="flex justify-between text-blue"><CreditCard size={24} /><span className="font-display font-bold">IQ</span></div><p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-text-muted">Premium access</p>
            </div>
            <div className="absolute left-1/2 top-1/2 w-[82%] max-w-xs rounded-2xl border border-blue/35 bg-gradient-to-r from-blue-deep to-blue p-5 text-black shadow-[0_20px_50px_-20px_rgba(182,255,59,.65)] [transform:translate(-50%,-35%)_rotate(-5deg)_rotateX(55deg)]">
              <div className="flex items-center justify-between"><span className="font-display text-lg font-bold">{plan?.name || 'Basic'}</span><span className="text-xs font-semibold">INTERVIEW IQ</span></div><p className="mt-7 text-xs font-semibold">Rs.{amount.toLocaleString()} / {cycleLabel}</p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue">Secure checkout</p><h2 className="mt-2 font-display text-2xl font-bold text-text-primary">Payment details</h2></div><ShieldCheck className="text-blue" size={24} /></div>
          <div className="mt-7 flex items-center justify-between rounded-2xl border border-border-subtle bg-white/[0.025] p-4"><div><p className="text-sm font-semibold text-text-primary">{plan?.name || 'Basic'} plan</p><p className="mt-1 text-xs text-text-muted">Billed {billingCycle === 'year' ? 'annually' : 'monthly'}</p></div><p className="font-display text-lg font-bold text-blue">Rs.{amount.toLocaleString()}</p></div>
          <div className="mt-7 grid gap-4">
            <div><label className="field-label" htmlFor="billing-phone">Billing phone</label><input id="billing-phone" className="field" type="tel" autoComplete="tel" placeholder="+94 77 123 4567" value={billing.phone} onChange={(event) => setBilling({ ...billing, phone: event.target.value })} /></div>
            <div><label className="field-label" htmlFor="billing-address">Billing address</label><input id="billing-address" className="field" autoComplete="street-address" placeholder="Street address" value={billing.address} onChange={(event) => setBilling({ ...billing, address: event.target.value })} /></div>
            <div><label className="field-label" htmlFor="billing-city">City</label><input id="billing-city" className="field" autoComplete="address-level2" placeholder="Colombo" value={billing.city} onChange={(event) => setBilling({ ...billing, city: event.target.value })} /></div>
            <p className="text-[11px] leading-5 text-text-disabled">These billing details are required by PayHere and are not added to your Interview IQ profile.</p>
          </div>
          {plan && <div className="mt-6 border-t border-border-subtle pt-5 flex items-center justify-between"><span className="text-sm font-semibold text-text-secondary">Total due today</span><span className="font-display text-xl font-bold text-text-primary">Rs.{amount.toLocaleString()}</span></div>}
          <Button fullWidth className="mt-5" loading={loading} icon={Lock} onClick={beginCheckout}>Pay Rs.{amount.toLocaleString()} securely</Button>
          <p className="text-[11px] text-text-disabled flex items-center gap-1.5 justify-center mt-3"><ShieldCheck size={12} />Card details are collected securely by PayHere and never touch Interview IQ servers.</p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-subtle pt-5"><Link to="/pricing" className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-blue"><ArrowLeft size={14} />Change plan</Link><span className="inline-flex items-center gap-1 text-[11px] text-text-disabled"><Check size={12} className="text-success" />Encrypted checkout</span></div>
        </section>
      </div>
    </div>
  )
}
