const express = require('express');
const ReportsController = require('../controllers/ReportsController');

const router = express.Router();

router.get('/reports/summary',              ReportsController.getSummary);
router.get('/reports/user/:user_id',        ReportsController.getUserReport);

module.exports = router;
