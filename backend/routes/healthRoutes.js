/**
 * Health Routes
 * Server health and status checks
 */

const express = require('express');
const HealthController = require('../controllers/HealthController');

const router = express.Router();

/**
 * GET /health
 * Server health check
 */
router.get('/health', HealthController.check);

module.exports = router;
