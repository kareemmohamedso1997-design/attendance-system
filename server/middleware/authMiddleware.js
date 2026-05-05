/**
 * Authentication Middleware
 * Verifies JWT token and checks user authorization
 */

const { verifyToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');

/**
 * Verify JWT token from request header
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('No token provided in request');
      return res.status(401).json({
        status: 'error',
        message: 'Access token required. Please login first.'
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      logger.warn('Invalid or expired token');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please login again.'
      });
    }

    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      employeeId: decoded.employeeId,
      role: decoded.role,
      username: decoded.username
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Unauthorized access attempt by user ${req.user.userId}`);
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Check if user is employee or admin
 */
const isEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'employee' && req.user.role !== 'admin') {
    logger.warn(`Invalid role: ${req.user.role}`);
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }

  next();
};

/**
 * Verify user can only access their own data
 */
const canAccessEmployeeData = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  const requestedEmployeeId = parseInt(req.params.employeeId || req.body.employee_id);

  // Admin can access any employee's data
  if (req.user.role === 'admin') {
    return next();
  }

  // Employee can only access their own data
  if (req.user.role === 'employee' && req.user.employeeId === requestedEmployeeId) {
    return next();
  }

  logger.warn(`User ${req.user.userId} attempted to access unauthorized employee data`);
  return res.status(403).json({
    status: 'error',
    message: 'You can only access your own attendance data'
  });
};

module.exports = {
  authenticateToken,
  isAdmin,
  isEmployee,
  canAccessEmployeeData
};
