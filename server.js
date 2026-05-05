// ── 1. Load env vars before anything else ────────────────────────────────────
require('dotenv').config();

// ── 2. Validate required vars before any module loads ────────────────────────
// database.js parses MYSQL_URL at require-time, so this must run first.
(function validateEnv() {
  const required = ['JWT_SECRET', 'MYSQL_URL'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\n[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    console.error('        Set these in your Railway / Render dashboard.\n');
    process.exit(1);
  }
})();

// ── 3. Load app modules after env is confirmed valid ─────────────────────────
const app    = require('./server/app');
const db     = require('./server/config/database');
const logger = require('./server/utils/logger');

const PORT = process.env.PORT || 3000;

// Test database connection before starting server
async function startServer() {
  try {
    // Test connection
    const connection = await db.getConnection();
    await connection.query('SELECT 1');
    connection.release();

    // Start the server
    const server = app.listen(PORT, () => {
      const env = (process.env.NODE_ENV || 'development').padEnd(20);
      const jwt = (process.env.JWT_SECRET ? 'Configured' : 'NOT SET').padEnd(25);
      logger.info(`
╔═══════════════════════════════════════════════╗
║  Production-Ready Attendance System Running   ║
║  URL: http://localhost:${PORT}                 ║
║  Environment: ${env} ║
║  JWT Secret: ${jwt} ║
║  Database: Connected Successfully             ║
╚═══════════════════════════════════════════════╝
      `);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        await db.pool.end();
        logger.info('HTTP server and database connections closed');
        process.exit(0);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err.message);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
