const express = require('express');
const AttendanceController = require('../controllers/AttendanceController');

const router = express.Router();

router.post('/attendance/check-in',          AttendanceController.checkIn);
router.post('/attendance/check-out',         AttendanceController.checkOut);
router.get('/attendance/today',              AttendanceController.getTodayAttendance);
router.get('/attendance/user/:user_id',      AttendanceController.getUserAttendance);

module.exports = router;
