// ── Token refresh module ───────────────────────────────────────────────────────
//
// Single source of the refresh logic, shared by:
//   1. The axios 401 interceptor in client.js  (reactive)
//   2. The silent-refresh timer in AuthContext  (proactive)
//
// The module-level promise acts as a lock: if a refresh is already in flight,
// every subsequent caller receives the SAME promise and resolves together when
// the single underlying request completes. This prevents:
//   • Duplicate /api/auth/refresh calls
//   • Token rotation race conditions (second call would receive a revoked token)
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios'
import {
  getRefreshToken,
  setToken,
  setRefreshToken,
  clearAuth,
} from '../utils/authStorage'

const BASE_URL = 'https://attendance-system-1-02ay.onrender.com'

// Dedicated axios instance with NO interceptors — using the main client here
// would cause an infinite 401 loop.
const rawAxios = axios.create({ baseURL: BASE_URL, timeout: 10_000 })

let inflightPromise = null  // lock

export async function attemptTokenRefresh() {
  // Return existing promise so all concurrent callers share one network request
  if (inflightPromise) return inflightPromise

  const rt = getRefreshToken()
  if (!rt) {
    clearAuth()
    window.dispatchEvent(new Event('auth:unauthorized'))
    return Promise.reject(new Error('No refresh token available.'))
  }

  inflightPromise = rawAxios
    .post('/api/auth/refresh', { refreshToken: rt })
    .then((res) => {
      const { accessToken, refreshToken: newRt } = res.data.data
      setToken(accessToken)
      setRefreshToken(newRt)
      // Notify AuthContext to sync React state without a page reload
      window.dispatchEvent(
        new CustomEvent('auth:tokenRefreshed', { detail: { accessToken } })
      )
      return accessToken
    })
    .catch((err) => {
      clearAuth()
      window.dispatchEvent(new Event('auth:unauthorized'))
      throw err
    })
    .finally(() => {
      inflightPromise = null
    })

  return inflightPromise
}
