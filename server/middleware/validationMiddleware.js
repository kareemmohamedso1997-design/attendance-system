/**
 * Input Validation Middleware
 *
 * Rules enforced here:
 *  - Required fields are present and non-empty
 *  - String inputs are trimmed and stripped of HTML tags (XSS prevention)
 *  - GPS coordinates are always provided as a pair (both or neither)
 *  - Date ranges are chronologically valid (from ≤ to)
 *  - Numeric IDs are positive integers
 *  - Passwords meet the minimum complexity requirement
 */

const { validationResult, body, query, param } = require('express-validator');
const logger = require('../utils/logger');

// ─── Error formatter ──────────────────────────────────────────────────────────

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => `${e.path || e.param}: ${e.msg}`);
    logger.warn(`Validation failed on ${req.method} ${req.path}: ${messages.join(' | ')}`);

    return res.status(422).json({
      status:  'error',
      message: 'Validation failed',
      errors:  errors.array().map(e => ({ field: e.path || e.param, message: e.msg }))
    });
  }

  next();
};

// ─── Shared sanitiser ────────────────────────────────────────────────────────
// Strips < > characters to prevent stored XSS via text fields.
const sanitizeStr = body => body.trim().replace(/[<>]/g, '');

// ─── Login ────────────────────────────────────────────────────────────────────

const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .customSanitizer(sanitizeStr),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// ─── Registration ─────────────────────────────────────────────────────────────

const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 20 }).withMessage('Username must be 3–20 characters')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Username may only contain letters, numbers, dots, hyphens, and underscores')
    .customSanitizer(sanitizeStr),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('employee_id')
    .notEmpty().withMessage('Employee ID is required')
    .isInt({ min: 1 }).withMessage('Employee ID must be a positive integer')
    .toInt(),
  handleValidationErrors
];

// ─── Check-in / Check-out ─────────────────────────────────────────────────────
//
// employee_id is optional in the body — the controller derives it from the
// authenticated user's JWT for regular employees. Admins may supply it.
//
// Coordinates are optional, but if either is supplied, both must be present.

const validateCheckInOut = [
  body('employee_id')
    .optional()
    .isInt({ min: 1 }).withMessage('employee_id must be a positive integer')
    .toInt(),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90')
    .toFloat()
    .custom((lat, { req }) => {
      if (lat !== undefined && req.body.longitude === undefined) {
        throw new Error('longitude is required when latitude is provided');
      }
      return true;
    }),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180')
    .toFloat()
    .custom((lon, { req }) => {
      if (lon !== undefined && req.body.latitude === undefined) {
        throw new Error('latitude is required when longitude is provided');
      }
      return true;
    }),

  // GPS accuracy in metres (provided by the browser Geolocation API)
  body('accuracy')
    .optional()
    .isFloat({ min: 0 }).withMessage('accuracy must be a non-negative number')
    .toFloat(),

  handleValidationErrors
];

// ─── Date range query ─────────────────────────────────────────────────────────

const validateDateRange = [
  query('employee_id')
    .optional()
    .isInt({ min: 1 }).withMessage('employee_id must be a positive integer')
    .toInt(),

  query('from_date')
    .optional()
    .isISO8601({ strict: true }).withMessage('from_date must be a valid date (YYYY-MM-DD)')
    .custom((from, { req }) => {
      const to = req.query.to_date;
      if (to && from > to) {
        throw new Error('from_date must not be later than to_date');
      }
      return true;
    }),

  query('to_date')
    .optional()
    .isISO8601({ strict: true }).withMessage('to_date must be a valid date (YYYY-MM-DD)')
    .custom(to => {
      const today = new Date().toISOString().split('T')[0];
      if (to > today) {
        throw new Error('to_date cannot be in the future');
      }
      return true;
    }),

  handleValidationErrors
];

// ─── Employee ID route param ──────────────────────────────────────────────────

const validateEmployeeIdParam = [
  param('employeeId')
    .isInt({ min: 1 }).withMessage('Employee ID must be a positive integer')
    .toInt(),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateCheckInOut,
  validateDateRange,
  validateEmployeeIdParam
};
