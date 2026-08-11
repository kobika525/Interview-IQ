import api from './axios'
import { items } from './apiUtils'

export async function getNotifications() {
  return items(await api.get('/notifications'))
}

export async function markAsRead(id) {
  await api.patch(`/notifications/${id}/read`)
  return getNotifications()
}

export async function markAllAsRead() {
  await api.patch('/notifications/read-all')
  return getNotifications()
}

export async function deleteNotification(id) {
  await api.delete(`/notifications/${id}`)
  return getNotifications()
}
