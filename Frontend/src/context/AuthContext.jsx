import { createContext, useState, useCallback } from 'react'
import * as authService from '../services/authService'
import { STORAGE_KEYS } from '../utils/constants'

// This module intentionally exports the context together with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

function loadStoredUser() {
  const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER)
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  if (!stored || !token) return null

  try {
    return JSON.parse(stored)
  } catch {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser)
  const loading = false

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token } = await authService.login(credentials)
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(loggedInUser))
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async (payload) => {
    const { user: newUser, token } = await authService.register(payload)
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(newUser))
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
    setUser(null)
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
