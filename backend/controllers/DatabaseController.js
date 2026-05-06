/**
 * Database Controller
 * Database connection and status endpoints
 */

const db = require('../config/database');
const logger = require('../utils/logger');

const DatabaseController = {
  /**
   * GET /db-test
   * Test database connection
   */
  testConnection: async (req, res) => {
    try {
      const result = await db.testConnection();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Database connection successful',
          database: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: { message: result.message }
        });
      }
    } catch (error) {
      logger.error('Database test error', error.message);
      res.status(500).json({
        success: false,
        error: { message: 'Database connection failed' }
      });
    }
  },

  /**
   * GET /db-status
   * Get detailed database status
   */
  getStatus: async (req, res) => {
    try {
      const result = await db.testConnection();

      if (result.success) {
        // Get table information
        const tablesResult = await db.query(`
          SELECT TABLE_NAME, TABLE_ROWS 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = ?
        `, [process.env.DB_NAME]);

        res.status(200).json({
          success: true,
          status: 'connected',
          database: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            name: process.env.DB_NAME
          },
          tables: tablesResult,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          status: 'disconnected',
          error: { message: result.message }
        });
      }
    } catch (error) {
      logger.error('Database status error', error.message);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get database status' }
      });
    }
  }
};

module.exports = DatabaseController;
