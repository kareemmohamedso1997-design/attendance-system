const logger = require('../utils/logger');

/**
 * authorizeRole(allowedRoles)
 *
 * Route middleware factory. Accepts either an array or spread arguments:
 *   authorizeRole(['admin', 'manager'])
 *   authorizeRole('admin', 'manager')   ← backward-compat spread form
 *
 * Must be applied AFTER authenticateToken so that req.user is populated.
 * Role comes from the JWT payload — never trust the frontend.
 */
function authorizeRole(allowedRoles) {
  // Support both authorizeRole(['admin']) and authorizeRole('admin', 'manager')
  const roles = Array.isArray(allowedRoles) ? allowedRoles : Array.from(arguments);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `RBAC denied: user=${req.user.userId} role=${req.user.role} ` +
        `tried ${req.method} ${req.originalUrl} (requires: ${roles.join('|')})`
      );
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied. Insufficient permissions.' },
      });
    }

    next();
  };
}

module.exports = authorizeRole;
