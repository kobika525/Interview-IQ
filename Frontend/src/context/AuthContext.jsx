import { createContext, useState, useEffect, useCallback } from 'react'
import * as authService from '../services/authService'
import { STORAGE_KEYS } from '../utils/constants'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER)
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token, refreshToken } = await authService.login(credentials)
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(loggedInUser))
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async (payload) => {
    const { user: newUser, token, refreshToken } = await authService.register(payload)
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(newUser))
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    // Logout must never depend on the revocation request succeeding. An expired
    // refresh token or an offline API should not keep a local session alive.
    const revokeRequest = authService.logout()
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
    setUser(null)
    try {
      await revokeRequest
    } catch {
      // Local logout is already complete; server tokens expire independently.
    }
  }, [])

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
