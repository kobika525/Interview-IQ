import { MOCK_USER } from '../data/mockData'
import { delay } from '../utils/helpers'

export async function getProfile() {
  await delay(400)
  return MOCK_USER
}

export async function updateProfile(payload) {
  await delay(700)
  return { ...MOCK_USER, ...payload }
}
