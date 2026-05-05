/**
 * Authentication Routes
 */

const express = require('express');
const { validateLogin, validateRegister } = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
router.post('/login', authLimiter, validateLogin, authController.login);

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', validateRegister, authController.register);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', authController.refreshToken);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
