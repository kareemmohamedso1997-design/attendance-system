/**
 * AppError — operational (expected) errors with an HTTP status code.
 *
 * Controllers throw AppError for business rule violations (duplicate check-in,
 * employee not found, etc.). The global errorHandler recognises these and
 * returns clean JSON without logging a full stack trace.
 *
 * Programming errors (unexpected crashes) are NOT AppErrors — the handler
 * treats them separately and logs them with full detail.
 */
class AppError extends Error {
  /**
   * @param {string} message  - Human-readable message sent to the client.
   * @param {number} statusCode - HTTP status code (400, 403, 404, 409, etc.).
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode  = statusCode;
    this.isOperational = true; // flag that distinguishes this from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
