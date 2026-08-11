import api from './axios'
import { toSnakeCase, unwrap } from './apiUtils'
import { STORAGE_KEYS } from '../utils/constants'

export async function login({ email, password }) {
  const data = unwrap(await api.post('/auth/login', { email, password, remember: true }))
  return { user: data.user, token: data.accessToken, refreshToken: data.refreshToken }
}

export async function register(payload) {
  const data = unwrap(await api.post('/auth/register', toSnakeCase({
    ...payload,
    confirmPassword: payload.confirmPassword || payload.password,
  })))
  return { user: data.user, token: data.accessToken, refreshToken: data.refreshToken }
}

export async function forgotPassword({ email }) {
  await api.post('/auth/forgot-password', { email })
  return { sent: true, email }
}

export async function resetPassword({ token, password, confirmPassword }) {
  await api.post('/auth/reset-password', {
    token,
    new_password: password,
    confirm_password: confirmPassword || password,
  })
  return { success: true }
}

export async function logout() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken })
  return { success: true }
}
