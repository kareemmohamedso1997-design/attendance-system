/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

const rateLimit = require('express-rate-limit');

/**
 * General rate limiter (100 requests per 15 minutes)
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' // Skip in development
});

/**
 * Authentication rate limiter (5 attempts per 15 minutes)
 * Prevents brute force password attacks
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by username + IP address
    return `${req.body.username || req.body.email}_${req.ip}`;
  },
  skip: (req) => process.env.NODE_ENV === 'development'
});

/**
 * Attendance operations rate limiter (20 requests per minute)
 */
const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many attendance operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

module.exports = {
  generalLimiter,
  authLimiter,
  attendanceLimiter
};
