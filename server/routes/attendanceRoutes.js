const express = require('express');
const { validateCheckInOut, validateEmployeeIdParam } = require('../middleware/validationMiddleware');
const { attendanceLimiter }    = require('../middleware/rateLimitMiddleware');
const {
  authenticateToken,
  canAccessEmployeeData,
}                              = require('../middleware/authMiddleware');
const authorizeRole            = require('../middleware/authorizeRole');
const attendanceController     = require('../controllers/attendanceController');

const router = express.Router();

// Every attendance endpoint requires a valid access token
router.use(authenticateToken);

// POST /api/attendance/checkin  — all authenticated employees
router.post('/checkin',  attendanceLimiter, validateCheckInOut, attendanceController.checkIn);

// POST /api/attendance/checkout — all authenticated employees
router.post('/checkout', attendanceLimiter, validateCheckInOut, attendanceController.checkOut);

// GET /api/attendance — employees see own records; admins see all (scoped in controller)
router.get('/', attendanceController.getAttendance);

// GET /api/attendance/today — employees see own; admins see all (scoped in controller)
router.get('/today', attendanceController.getTodayAttendance);

// GET /api/attendance/status/:employeeId — self or admin
router.get('/status/:employeeId', validateEmployeeIdParam, canAccessEmployeeData, attendanceController.getCurrentStatus);

// GET /api/attendance/employees — admin and manager only
// Exposes the full active-employee list; employees must not enumerate other users.
router.get('/employees', authorizeRole(['admin', 'manager']), attendanceController.getEmployees);

// GET /api/attendance/statistics — admin and manager only
// Aggregated stats; employee-scoped stats are delivered via /user/:id instead.
router.get('/statistics', authorizeRole(['admin', 'manager']), attendanceController.getStatistics);

// GET /api/attendance/user/:id — self or admin (ownership enforced in controller)
router.get('/user/:id', attendanceController.getUserAttendance);

module.exports = router;
