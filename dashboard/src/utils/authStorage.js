// ─── Storage Keys ─────────────────────────────────────────────────────────────
// ALL localStorage keys live here. No other file may call localStorage directly.
const TOKEN_KEY         = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const USER_KEY          = 'auth_user'

export { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY }

// ─── Access Token ─────────────────────────────────────────────────────────────
export function getToken()        { return localStorage.getItem(TOKEN_KEY) }
export function setToken(token)   { localStorage.setItem(TOKEN_KEY, token) }
export function clearToken()      { localStorage.removeItem(TOKEN_KEY) }

// ─── Refresh Token ────────────────────────────────────────────────────────────
export function getRefreshToken()        { return localStorage.getItem(REFRESH_TOKEN_KEY) }
export function setRefreshToken(token)   { localStorage.setItem(REFRESH_TOKEN_KEY, token) }
export function clearRefreshToken()      { localStorage.removeItem(REFRESH_TOKEN_KEY) }

// ─── User ─────────────────────────────────────────────────────────────────────
export function getUser()      { try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null } }
export function setUser(user)  { localStorage.setItem(USER_KEY, JSON.stringify(user)) }
export function clearUser()    { localStorage.removeItem(USER_KEY) }

// ─── Token Validity ───────────────────────────────────────────────────────────
// Reads the stored access token and validates its signature payload.
// Returns false for missing, malformed, or expired tokens (30 s clock-skew buffer).
export function isTokenValid() {
  const token = getToken()
  if (!token) return false
  try {
    const b64     = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(b64))
    if (!exp) return true
    return Date.now() < exp * 1000 - 30_000
  } catch {
    return false
  }
}

// Returns true when the access token will expire within the next 2 minutes.
// Used by the silent-refresh loop to decide when to proactively rotate.
export function isSessionExpiringSoon() {
  const token = getToken()
  if (!token) return true
  try {
    const b64     = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(b64))
    if (!exp) return false
    return Date.now() >= exp * 1000 - 2 * 60_000  // 2-minute warning window
  } catch {
    return true
  }
}

// ─── Role Helpers ─────────────────────────────────────────────────────────────
export function getUserRole() {
  return getUser()?.role ?? null
}

// allowedRoles can be a string or an array.
export function hasPermission(allowedRoles) {
  const role = getUserRole()
  if (!role) return false
  return Array.isArray(allowedRoles) ? allowedRoles.includes(role) : role === allowedRoles
}

// ─── Compound Operations ──────────────────────────────────────────────────────

// Atomically write a full session. Always call this instead of individual setters.
export function persistAuth(accessToken, refreshToken, user) {
  setToken(accessToken)
  setRefreshToken(refreshToken)
  setUser(user)
}

// Atomically wipe the entire session.
export function clearAuth() {
  clearToken()
  clearRefreshToken()
  clearUser()
}

// Read the current session. Auto-clears and returns nulls if the access token
// is expired so the rest of the app never starts with a dead token.
export function getStoredAuth() {
  if (!isTokenValid()) {
    clearAuth()
    return { token: null, refreshToken: null, user: null }
  }
  return { token: getToken(), refreshToken: getRefreshToken(), user: getUser() }
}
