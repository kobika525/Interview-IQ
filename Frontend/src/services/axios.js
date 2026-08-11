import axios from 'axios'
import { STORAGE_KEYS } from '../utils/constants'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    if (error.response?.status === 401 && refreshToken && !original?._retry && !original?.url?.includes('/auth/refresh')) {
      original._retry = true
      try {
        const response = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken })
        const tokens = response.data.data
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.access_token)
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token)
        original.headers.Authorization = `Bearer ${tokens.access_token}`
        return api(original)
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
        if (!window.location.pathname.startsWith('/login')) window.location.assign('/login')
      }
    }
    const message = error.response?.data?.message || error.message || 'The request could not be completed.'
    const apiError = new Error(message)
    apiError.code = error.response?.data?.error?.code
    apiError.status = error.response?.status
    apiError.details = error.response?.data?.error?.details || []
    return Promise.reject(apiError)
  },
)

export default api
