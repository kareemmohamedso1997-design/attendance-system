const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const { getAllUsers, getUserById }    = require('../controllers/userController');

const router = express.Router();

// All user-management endpoints require a valid JWT and admin role
router.use(authenticateToken, isAdmin);

router.get('/',    getAllUsers);
router.get('/:id', getUserById);

module.exports = router;
