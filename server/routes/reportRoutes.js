const express = require('express');
const { authenticateToken, isAdmin }        = require('../middleware/authMiddleware');
const { validateDateRange }                 = require('../middleware/validationMiddleware');
const { exportExcel, exportPdf,
        getSummary, getUserReport }          = require('../controllers/reportController');

const router = express.Router();

// All report endpoints require a valid JWT and admin role
router.use(authenticateToken, isAdmin);

// GET /api/reports/summary
router.get('/summary', getSummary);

// GET /api/reports/user/:id
router.get('/user/:id', getUserReport);

// GET /api/reports/excel?employee_id=&from_date=&to_date=&scope=page|all&limit=&offset=
router.get('/excel', validateDateRange, exportExcel);

// GET /api/reports/pdf?employee_id=&from_date=&to_date=&scope=page|all&limit=&offset=
router.get('/pdf', validateDateRange, exportPdf);

module.exports = router;
