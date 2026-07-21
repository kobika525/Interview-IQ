import axios from 'axios'
import { STORAGE_KEYS } from '../utils/constants'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — placeholder for logout-on-expiry logic.
      // localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      // window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
