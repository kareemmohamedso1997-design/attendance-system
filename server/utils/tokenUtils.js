/**
 * JWT Token Utilities
 * Generate and verify JWT tokens
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId, employeeId, role, username) => {
  const payload = {
    userId,
    employeeId,
    role,
    username,
    type: 'access'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Decode JWT token without verification (for debugging)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
};
