const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const UserController = {
  /**
   * POST /users
   * Create a new user
   */
  createUser: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return next(new AppError('name, email, and password are required', 400));
      }

      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      const result = await query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [trimmedName, normalizedEmail, password]
      );

      const [user] = await query(
        'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
        [result.insertId]
      );

      logger.info('User created', `id=${user.id} email=${user.email}`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return next(new AppError('A user with that email already exists', 409));
      }
      logger.error('createUser failed', error.message);
      next(error);
    }
  },

  /**
   * GET /users
   * Return all users (password excluded)
   */
  getAllUsers: async (req, res, next) => {
    try {
      const users = await query(
        'SELECT id, name, email, created_at, updated_at FROM users ORDER BY created_at DESC',
        []
      );

      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      logger.error('getAllUsers failed', error.message);
      next(error);
    }
  },

  /**
   * GET /users/:id
   * Return a single user by primary key
   */
  getUserById: async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (!Number.isInteger(id) || id < 1) {
        return next(new AppError('User ID must be a positive integer', 400));
      }

      const [user] = await query(
        'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );

      if (!user) {
        return next(new AppError(`User ${id} not found`, 404));
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('getUserById failed', error.message);
      next(error);
    }
  }
};

module.exports = UserController;
