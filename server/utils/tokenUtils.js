const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

// ── Access token (short-lived) ────────────────────────────────────────────────
// 15 m by default. Contains userId, employeeId, role — enough for every
// middleware to authorise without a DB round-trip.
const generateAccessToken = (userId, employeeId, role, username) =>
  jwt.sign(
    { userId, employeeId, role, username, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );

// ── Refresh token (long-lived) ────────────────────────────────────────────────
// 7 d by default. Minimal payload — only userId and type.
// The raw JWT is never stored in DB; only its SHA-256 hash is.
const generateRefreshToken = (userId) =>
  jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

// ── Verify / decode ───────────────────────────────────────────────────────────
const verifyToken = (token) => {
  try   { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

const decodeToken = (token) => {
  try   { return jwt.decode(token); }
  catch { return null; }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// SHA-256 hex of a token — stored in refresh_tokens.token_hash.
// We never keep the raw bearer value in the database.
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Extract the expiry Date from a JWT's exp claim (without full verification).
// Returns a Date or null if the token carries no exp.
const getTokenExpiry = (token) => {
  try {
    const { exp } = jwt.decode(token);
    return exp ? new Date(exp * 1000) : null;
  } catch { return null; }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  hashToken,
  getTokenExpiry,
};
