/**
 * Database Routes
 * Database connection and status endpoints
 */

const express = require('express');
const DatabaseController = require('../controllers/DatabaseController');

const router = express.Router();

/**
 * GET /db-test
 * Test database connection
 */
router.get('/db-test', DatabaseController.testConnection);

/**
 * GET /db-status
 * Get database status with table information
 */
router.get('/db-status', DatabaseController.getStatus);

module.exports = router;
