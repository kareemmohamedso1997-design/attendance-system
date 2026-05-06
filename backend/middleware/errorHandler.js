/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 */

const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Request Error', `${statusCode} - ${message}`);

  // Don't expose internal error details in production
  const errorResponse = {
    success: false,
    error: {
      statusCode,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : message
    }
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      statusCode: 404,
      message: `Route ${req.originalUrl} not found`
    }
  });
};

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError
};
