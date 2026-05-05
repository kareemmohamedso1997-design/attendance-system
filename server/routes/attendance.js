const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

/**
 * Attendance Routes
 * All routes are prefixed with /api
 */

// Check-in route
router.post('/checkin', attendanceController.checkIn);

// Check-out route
router.post('/checkout', attendanceController.checkOut);

// Get attendance records
router.get('/attendance', attendanceController.getAttendance);

// Get employee list
router.get('/employees', attendanceController.getEmployees);

// Get statistics
router.get('/statistics', attendanceController.getStatistics);

module.exports = router;
