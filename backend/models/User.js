/**
 * User Model
 * Database operations for users
 */

const db = require('../config/database');
const logger = require('../utils/logger');

const User = {
  /**
   * Create a new user
   */
  create: async (userData) => {
    try {
      const { name, email, password } = userData;

      const result = await db.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, password]
      );

      logger.debug(`User created with ID: ${result.insertId}`);
      return { id: result.insertId, name, email };
    } catch (error) {
      logger.error('Error creating user', error.message);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getById: async (userId) => {
    try {
      const result = await db.query(
        'SELECT id, name, email, created_at FROM users WHERE id = ?',
        [userId]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('Error fetching user', error.message);
      throw error;
    }
  },

  /**
   * Get user by email
   */
  getByEmail: async (email) => {
    try {
      const result = await db.query(
        'SELECT id, name, email, password, created_at FROM users WHERE email = ?',
        [email]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('Error fetching user by email', error.message);
      throw error;
    }
  },

  /**
   * Get all users with pagination
   */
  getAll: async (page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;

      const users = await db.query(
        'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const countResult = await db.query('SELECT COUNT(*) as count FROM users');
      const total = countResult[0].count;

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching users', error.message);
      throw error;
    }
  },

  /**
   * Update user
   */
  update: async (userId, userData) => {
    try {
      const { name, email } = userData;

      await db.query(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name, email, userId]
      );

      logger.debug(`User ${userId} updated`);
      return { id: userId, name, email };
    } catch (error) {
      logger.error('Error updating user', error.message);
      throw error;
    }
  },

  /**
   * Delete user
   */
  delete: async (userId) => {
    try {
      const result = await db.query('DELETE FROM users WHERE id = ?', [userId]);

      logger.debug(`User ${userId} deleted`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting user', error.message);
      throw error;
    }
  }
};

module.exports = User;
