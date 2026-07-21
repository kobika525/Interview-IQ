import { ADMIN_STATS, ADMIN_USERS, ADMIN_QUESTIONS, ADMIN_RESOURCES } from '../data/mockData'
import { delay } from '../utils/helpers'

export async function getAdminStats() {
  await delay(500)
  return ADMIN_STATS
}

export async function getAdminUsers() {
  await delay(500)
  return ADMIN_USERS
}

export async function getAdminQuestions() {
  await delay(500)
  return ADMIN_QUESTIONS
}

export async function getAdminResources() {
  await delay(500)
  return ADMIN_RESOURCES
}
