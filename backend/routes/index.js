/**
 * Main Routes
 * Aggregates all route handlers
 */

const express = require('express');
const healthRoutes = require('./healthRoutes');
const databaseRoutes = require('./databaseRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const reportsRoutes = require('./reportsRoutes');

const router = express.Router();

/**
 * Register all routes
 */
router.use('/', healthRoutes);
router.use('/', databaseRoutes);
router.use('/', userRoutes);
router.use('/', authRoutes);
router.use('/', attendanceRoutes);
router.use('/', reportsRoutes);

module.exports = router;
