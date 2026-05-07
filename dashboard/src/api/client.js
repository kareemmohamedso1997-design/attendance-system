import axios from 'axios'
import { getToken } from '../utils/authStorage'
import { attemptTokenRefresh } from './tokenRefresh'

const client = axios.create({
  baseURL: 'https://attendance-system-1-02ay.onrender.com',
  timeout: 25_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach current access token to every request ──────────────────────────────
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── 401 handler: attempt one silent refresh then retry ────────────────────────
//
// Flow on 401:
//   1. Mark request as already-retried (_retry flag) to prevent infinite loops.
//   2. Call attemptTokenRefresh() — the module-level lock in tokenRefresh.js
//      ensures that if 10 requests fail at once, only ONE refresh call is made;
//      all 10 requests wait on the same promise and retry with the new token.
//   3. On refresh success → retry original request with new token.
//   4. On refresh failure → clearAuth() + dispatch 'auth:unauthorized' (already
//      done inside attemptTokenRefresh), then reject — AuthContext logs out and
//      ProtectedRoute redirects to /login.
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }
    original._retry = true

    try {
      const newToken = await attemptTokenRefresh()
      original.headers.Authorization = `Bearer ${newToken}`
      return client(original)
    } catch {
      // attemptTokenRefresh already called clearAuth + dispatched auth:unauthorized
      return Promise.reject(err)
    }
  }
)

export default client
