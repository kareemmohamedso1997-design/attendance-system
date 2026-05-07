const { verifyToken } = require('../utils/tokenUtils');
const logger          = require('../utils/logger');
const authorizeRole   = require('./authorizeRole');

// ── Shared token extractor ────────────────────────────────────────────────────
function extractBearer(req) {
  const header = req.headers['authorization'];
  return header && header.startsWith('Bearer ') ? header.slice(7) : null;
}

// ── Shared error helpers ──────────────────────────────────────────────────────
const unauthorized = (res, message = 'Authentication required.') =>
  res.status(401).json({
    success: false,
    error: { code: 'UNAUTHORIZED', message },
  });

const forbidden = (res, message = 'Access denied. Insufficient permissions.') =>
  res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message },
  });

// ── authenticateAccessToken ───────────────────────────────────────────────────
// Validates the Authorization: Bearer <accessToken> header.
// Rejects refresh tokens accidentally sent to API endpoints (type check).
// Populates req.user = { userId, employeeId, role, username } from JWT payload.
// Role comes from the signed token — never from the frontend.
const authenticateAccessToken = (req, res, next) => {
  try {
    const token = extractBearer(req);
    if (!token) return unauthorized(res, 'Access token required.');

    const decoded = verifyToken(token);
    if (!decoded) return unauthorized(res, 'Invalid or expired access token.');

    if (decoded.type && decoded.type !== 'access') {
      logger.warn(`Wrong token type '${decoded.type}' used on ${req.originalUrl}`);
      return unauthorized(res, 'Invalid token type.');
    }

    req.user = {
      userId:     decoded.userId,
      employeeId: decoded.employeeId,
      role:       decoded.role,
      username:   decoded.username,
    };
    next();
  } catch (err) {
    logger.error('authenticateAccessToken error:', err.message);
    return unauthorized(res, 'Authentication failed.');
  }
};

// Backward-compatible alias — existing imports of authenticateToken still work
const authenticateToken = authenticateAccessToken;

// ── authenticateRefreshToken ──────────────────────────────────────────────────
// Used exclusively on POST /api/auth/refresh.
// Ensures only refresh-type tokens are accepted on that endpoint.
const authenticateRefreshToken = (req, res, next) => {
  try {
    const token = req.body?.refreshToken;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Refresh token required.' },
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'refresh') {
      return unauthorized(res, 'Invalid refresh token.');
    }

    req.refreshPayload = decoded;
    next();
  } catch (err) {
    logger.error('authenticateRefreshToken error:', err.message);
    return unauthorized(res, 'Token validation failed.');
  }
};

// ── Legacy helpers (backward compat) ─────────────────────────────────────────
// These delegate to the canonical authorizeRole() in authorizeRole.js so there
// is exactly one implementation of the role-check logic.
const isAdmin    = authorizeRole(['admin']);
const isEmployee = authorizeRole(['employee', 'admin']);

// ── canAccessEmployeeData ─────────────────────────────────────────────────────
// Allows admins unrestricted access; employees may only access their own record.
// Used on routes that take :employeeId as a path param (e.g. /status/:employeeId).
const canAccessEmployeeData = (req, res, next) => {
  if (!req.user) return unauthorized(res);
  if (req.user.role === 'admin') return next();

  const requested = parseInt(req.params.employeeId || req.body.employee_id, 10);
  if (req.user.employeeId === requested) return next();

  logger.warn(
    `canAccessEmployeeData denied: user=${req.user.userId} (${req.user.role}) ` +
    `tried to access employee=${requested}`
  );
  return forbidden(res, 'You can only access your own data.');
};

module.exports = {
  authenticateToken,          // alias → authenticateAccessToken
  authenticateAccessToken,
  authenticateRefreshToken,
  authorizeRole,              // re-exported from ./authorizeRole for convenience
  isAdmin,
  isEmployee,
  canAccessEmployeeData,
};
