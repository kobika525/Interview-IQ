import { MOCK_USER, ADMIN_USER } from '../data/mockData'
import { delay, randomId } from '../utils/helpers'

// Mock implementation. Replace bodies with real `api.post(...)` calls
// against your FastAPI backend once endpoints are ready.

export async function login({ email, password }) {
  await delay(900)
  if (email === 'admin@interviewiq.app') {
    return { user: ADMIN_USER, token: randomId('admintok') }
  }
  if (!email || !password || password.length < 6) {
    const err = new Error('Invalid email or password')
    err.code = 'INVALID_CREDENTIALS'
    throw err
  }
  return { user: { ...MOCK_USER, email }, token: randomId('tok') }
}

export async function register(payload) {
  await delay(1100)
  return { user: { ...MOCK_USER, ...payload }, token: randomId('tok') }
}

export async function forgotPassword({ email }) {
  await delay(900)
  return { sent: true, email }
}

export async function resetPassword({ password }) {
  await delay(900)
  return { success: true }
}

export async function logout() {
  await delay(200)
  return { success: true }
}
