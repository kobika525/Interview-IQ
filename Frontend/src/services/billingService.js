import api from './axios'
import { items, unwrap } from './apiUtils'

const PLAN_PRESENTATION = {
  free: {
    tagline: 'Get started with the basics.',
    features: [
      '3 resume scans per month',
      '5 text and 3 voice interviews',
      '2 video interviews',
      'Career roadmap access',
      '1 saved interview report',
    ],
  },
  basic: {
    tagline: 'Full interview preparation, unlocked.',
    highlight: true,
    features: [
      'Unlimited resume scans',
      'Unlimited text and voice interviews',
      'Unlimited video interviews',
      'Full interview report history',
      'Premium learning resources',
      'Career roadmap access',
    ],
  },
  pro: {
    tagline: 'For serious, fast-track preparation.',
    features: [
      'Everything included in Basic',
      'Advanced video delivery analysis',
      'Personalised coaching roadmap',
      'Full interview report history',
      'Premium learning resources',
      'Priority access to new features',
    ],
  },
}

function normalizePlan(plan) {
  const code = String(plan.code || '').toLowerCase()
  const presentation = PLAN_PRESENTATION[code] || {}
  return {
    ...plan,
    id: code,
    name: plan.name || `${code[0]?.toUpperCase() || ''}${code.slice(1)}`,
    price: Number(plan.priceMonthly ?? plan.monthlyPrice ?? 0),
    annualPrice: Number(plan.priceYearly ?? plan.annualPrice ?? 0),
    tagline: plan.tagline || presentation.tagline || '',
    highlight: plan.highlight ?? presentation.highlight ?? false,
    features: plan.features?.length ? plan.features : (presentation.features || []),
  }
}

export async function getPlans() {
  return (unwrap(await api.get('/subscriptions/plans')) || []).map(normalizePlan)
}

export async function getInvoices() {
  return items(await api.get('/billing/invoices')).map((invoice) => ({
    ...invoice,
    date: invoice.issuedAt || invoice.createdAt,
    plan: invoice.planName || invoice.description || 'Subscription',
    amount: Number(invoice.amount || 0),
  }))
}

export async function getPayments() {
  return items(await api.get('/billing/payments')).map((payment) => ({
    ...payment,
    date: payment.createdAt,
    plan: payment.planName,
    amount: Number(payment.amount || 0),
  }))
}

export async function createCheckoutSession({ planId, billingCycle = 'month' }) {
  return unwrap(await api.post('/subscriptions/checkout-session', {
    plan_code: planId,
    billing_cycle: billingCycle,
  }))
}

export async function getCheckoutStatus(sessionId) {
  return unwrap(await api.get(`/subscriptions/checkout-session/${sessionId}`))
}

export async function createPayHereCheckout({ planId, billingCycle = 'month', phone, address, city }) {
  return unwrap(await api.post('/subscriptions/payhere/checkout', {
    plan_code: planId,
    billing_cycle: billingCycle,
    phone,
    address,
    city,
  }))
}

export async function getPayHereOrderStatus(orderId) {
  return unwrap(await api.get(`/subscriptions/payhere/orders/${orderId}`))
}

export async function getCurrentSubscription() {
  return unwrap(await api.get('/subscriptions/current'))
}

export async function cancelSubscription() {
  await api.post('/subscriptions/cancel')
  return { success: true }
}
