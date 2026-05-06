/**
 * Global Error Handler
 *
 * Two categories of errors:
 *   1. Operational (AppError.isOperational = true) — expected business rule
 *      violations. Log a one-line warning; return the message to the client.
 *   2. Programming / unexpected — log the full stack; return a generic "500"
 *      message so internals are never exposed to the client.
 */

const logger = require('../utils/logger');

// ─── MySQL error code → HTTP status + client message ─────────────────────────
const MYSQL_ERRORS = {
  ER_DUP_ENTRY:            { status: 409, message: 'Duplicate record — this entry already exists.' },
  ER_NO_REFERENCED_ROW_2:  { status: 400, message: 'Invalid reference — the related record does not exist.' },
  ER_NO_REFERENCED_ROW:    { status: 400, message: 'Invalid reference — the related record does not exist.' },
  ER_ROW_IS_REFERENCED_2:  { status: 409, message: 'This record is in use and cannot be deleted.' },
  ER_DATA_TOO_LONG:        { status: 400, message: 'One or more values exceed the maximum allowed length.' },
  ER_TRUNCATED_WRONG_VALUE:{ status: 400, message: 'Invalid value for one of the fields.' },
  ER_LOCK_DEADLOCK:        { status: 503, message: 'Database is busy — please try again in a moment.' },
  ER_LOCK_WAIT_TIMEOUT:    { status: 503, message: 'Database is busy — please try again in a moment.' },
};

// ─── Handler ─────────────────────────────────────────────────────────────────
const errorHandler = (error, req, res, next) => {
  // Build context string for log lines
  const user    = req.user ? `user=${req.user.userId} role=${req.user.role}` : 'unauthenticated';
  const context = `[${req.method} ${req.originalUrl}] [${user}]`;

  // ── helper: build a consistent error envelope ────────────────────────────
  const errorResponse = (statusCode, message, extra = {}) => ({
    success: false,
    error: { statusCode, message, ...extra }
  });

  // ── 1. Operational / known business errors ────────────────────────────────
  if (error.isOperational) {
    logger.warn(`${context} ${error.message}`);
    return res.status(error.statusCode).json(errorResponse(error.statusCode, error.message));
  }

  // ── 2. JWT errors (treated as operational) ────────────────────────────────
  if (error.name === 'JsonWebTokenError') {
    logger.warn(`${context} Invalid JWT token`);
    return res.status(401).json(errorResponse(401, 'Invalid token. Please log in again.'));
  }

  if (error.name === 'TokenExpiredError') {
    logger.warn(`${context} Expired JWT token`);
    return res.status(401).json(errorResponse(401, 'Session expired. Please log in again.'));
  }

  // ── 3. MySQL errors ───────────────────────────────────────────────────────
  if (error.code && MYSQL_ERRORS[error.code]) {
    const { status, message } = MYSQL_ERRORS[error.code];
    logger.warn(`${context} MySQL ${error.code}: ${error.message}`);
    return res.status(status).json(errorResponse(status, message));
  }

  // ── 4. express-validator ValidationError (should be caught upstream) ─────
  if (error.name === 'ValidationError') {
    logger.warn(`${context} Validation: ${error.message}`);
    return res.status(422).json(errorResponse(422, error.message));
  }

  // ── 5. Unknown / programming error — log full detail, hide from client ────
  logger.error(`${context} UNHANDLED ERROR: ${error.message}\n${error.stack}`);

  const body = errorResponse(500, 'An unexpected error occurred. Please try again later.');

  if (process.env.NODE_ENV === 'development') {
    body.error.detail = error.message;
    body.error.stack  = error.stack;
  }

  return res.status(500).json(body);
};

module.exports = errorHandler;
