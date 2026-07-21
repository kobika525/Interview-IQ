import { PLANS, INVOICES } from '../data/mockData'
import { delay, randomId } from '../utils/helpers'

export async function getPlans() {
  await delay(300)
  return PLANS
}

export async function getInvoices() {
  await delay(400)
  return INVOICES
}

// Mock checkout — replace with a real payment provider (e.g. Stripe) call later.
export async function subscribe({ planId, card }) {
  await delay(1400)
  if (!card?.number || card.number.replace(/\s/g, '').length < 12) {
    const err = new Error('Card number looks invalid.')
    err.code = 'CARD_INVALID'
    throw err
  }
  const plan = PLANS.find((p) => p.id === planId)
  return {
    success: true,
    plan: plan?.id || planId,
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    invoiceId: randomId('inv'),
  }
}

export async function cancelSubscription() {
  await delay(800)
  return { success: true }
}
