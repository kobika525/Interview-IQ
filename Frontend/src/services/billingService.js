import api from './axios'
import { items, unwrap } from './apiUtils'

function normalizePlan(plan) {
  const code = String(plan.code || '').toLowerCase()
  return {
    ...plan,
    id: code,
    name: plan.name || `${code[0]?.toUpperCase() || ''}${code.slice(1)}`,
    price: Number(plan.priceMonthly ?? plan.monthlyPrice ?? 0),
    annualPrice: Number(plan.priceYearly ?? plan.annualPrice ?? 0),
    features: plan.features || [],
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
