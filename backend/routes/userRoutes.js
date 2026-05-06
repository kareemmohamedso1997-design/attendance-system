const express = require('express');
const UserController = require('../controllers/UserController');

const router = express.Router();

router.post('/users', UserController.createUser);
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);

module.exports = router;
