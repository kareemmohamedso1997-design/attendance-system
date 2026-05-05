/**
 * Attendance Routes
 */

const express = require('express');
const { validateCheckInOut, validateEmployeeIdParam } = require('../middleware/validationMiddleware');
const { attendanceLimiter } = require('../middleware/rateLimitMiddleware');
const { authenticateToken, isEmployee, canAccessEmployeeData } = require('../middleware/authMiddleware');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

/**
 * All attendance routes require authentication
 */
router.use(authenticateToken);

/**
 * POST /api/attendance/checkin
 * Employee checks in with optional GPS location
 */
router.post('/checkin', attendanceLimiter, validateCheckInOut, attendanceController.checkIn);

/**
 * POST /api/attendance/checkout
 * Employee checks out with optional GPS location
 */
router.post('/checkout', attendanceLimiter, validateCheckInOut, attendanceController.checkOut);

/**
 * GET /api/attendance
 * Get attendance records (employees see own, admins see all)
 */
router.get('/', attendanceController.getAttendance);

/**
 * GET /api/attendance/today
 * Get today's attendance records
 */
router.get('/today', attendanceController.getTodayAttendance);

/**
 * GET /api/attendance/status/:employeeId
 * Get current status of an employee
 */
router.get('/status/:employeeId', validateEmployeeIdParam, canAccessEmployeeData, attendanceController.getCurrentStatus);

/**
 * GET /api/employees
 * Get list of all active employees
 */
router.get('/employees', attendanceController.getEmployees);

/**
 * GET /api/statistics
 * Get attendance statistics
 */
router.get('/statistics', attendanceController.getStatistics);

module.exports = router;
