import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getStoredAuth,
  persistAuth,
  clearAuth,
  getUser,
  getRefreshToken,
  isSessionExpiringSoon,
  getUserRole,
} from '../utils/authStorage'
import { attemptTokenRefresh } from '../api/tokenRefresh'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // ── Synchronous initialisation ────────────────────────────────────────────
  // getStoredAuth() reads localStorage, validates JWT expiry, auto-clears stale
  // data — all before the first render. isAuthenticated is correct on frame 1.
  const initial          = getStoredAuth()
  const [token, setToken] = useState(initial.token)
  const [user,  setUser]  = useState(initial.user)

  // ── Auth actions ──────────────────────────────────────────────────────────

  // login() signature includes refreshToken (returned by the login endpoint).
  const login = useCallback((accessToken, refreshToken, userData) => {
    persistAuth(accessToken, refreshToken, userData)
    setToken(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
    // No routing here — ProtectedRoute observes isAuthenticated and redirects.
  }, [])

  // ── Sync React state when the interceptor silently refreshes the token ────
  // attemptTokenRefresh() in client.js updates localStorage directly; this
  // effect keeps React state in sync so the UI stays consistent.
  useEffect(() => {
    const onRefreshed = (e) => setToken(e.detail.accessToken)
    window.addEventListener('auth:tokenRefreshed', onRefreshed)
    return () => window.removeEventListener('auth:tokenRefreshed', onRefreshed)
  }, [])

  // ── 401 bridge (same-tab) ─────────────────────────────────────────────────
  // The axios interceptor dispatches 'auth:unauthorized' when refresh fails.
  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout)
    return () => window.removeEventListener('auth:unauthorized', logout)
  }, [logout])

  // ── Cross-tab sync ────────────────────────────────────────────────────────
  // 'storage' fires in every OTHER tab — logout in one tab propagates to all.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY) {
        setToken(e.newValue || null)
        if (!e.newValue) setUser(null)
      }
      if (e.key === REFRESH_TOKEN_KEY && !e.newValue) {
        setToken(null)
        setUser(null)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ── Silent proactive refresh ──────────────────────────────────────────────
  // Runs every 5 minutes. If the access token will expire within 2 minutes,
  // refresh it before any request fails. The lock in tokenRefresh.js ensures
  // this never races with a concurrent 401-triggered refresh.
  useEffect(() => {
    if (!token) return  // not logged in — no timer needed

    const tick = async () => {
      if (!isSessionExpiringSoon() || !getRefreshToken()) return
      try {
        await attemptTokenRefresh()
      } catch {
        // Failure already dispatched auth:unauthorized which triggers logout()
      }
    }

    const id = setInterval(tick, 5 * 60_000)
    return () => clearInterval(id)
  }, [token])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      role: getUserRole(),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
