/**
 * Health Controller
 * Health check and server status endpoints
 */

const logger = require('../utils/logger');

const HealthController = {
  /**
   * GET /health
   * Simple health check endpoint
   */
  check: (req, res) => {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptime),
          formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        environment: process.env.NODE_ENV || 'development',
        memory: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
        }
      });
    } catch (error) {
      logger.error('Health check error', error.message);
      res.status(500).json({
        success: false,
        error: { message: 'Health check failed' }
      });
    }
  }
};

module.exports = HealthController;
