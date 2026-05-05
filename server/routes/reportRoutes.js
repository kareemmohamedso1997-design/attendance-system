/**
 * Report Routes — admin only
 */

const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const { exportExcel, exportPdf } = require('../controllers/reportController');
const { validateDateRange } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticateToken, isAdmin);

// GET /api/reports/excel?employee_id=&from_date=&to_date=&scope=page|all&limit=&offset=
router.get('/excel', validateDateRange, exportExcel);

// GET /api/reports/pdf?employee_id=&from_date=&to_date=&scope=page|all&limit=&offset=
router.get('/pdf', validateDateRange, exportPdf);

module.exports = router;
