import api from './axios'
import { items, unwrap } from './apiUtils'

export async function getTickets() {
  return items(await api.get('/support/tickets'))
}

export async function createTicket(payload) {
  return unwrap(await api.post('/support/tickets', {
    subject: payload.subject,
    category: payload.category.toUpperCase(),
    message: payload.message,
  }))
}
