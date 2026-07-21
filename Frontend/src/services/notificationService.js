import { NOTIFICATIONS } from '../data/mockData'
import { delay } from '../utils/helpers'

let store = [...NOTIFICATIONS]

export async function getNotifications() {
  await delay(400)
  return store
}

export async function markAsRead(id) {
  await delay(150)
  store = store.map((n) => (n.id === id ? { ...n, read: true } : n))
  return store
}

export async function markAllAsRead() {
  await delay(200)
  store = store.map((n) => ({ ...n, read: true }))
  return store
}

export async function deleteNotification(id) {
  await delay(150)
  store = store.filter((n) => n.id !== id)
  return store
}
