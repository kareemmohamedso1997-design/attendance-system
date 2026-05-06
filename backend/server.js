/**
 * Main Server Entry Point
 * Initializes Express app and database
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const db = require('./config/database');
const logger = require('./utils/logger');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware Setup
 */

// Security
app.use(helmet());

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Request handler
 */
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Routes
 */
app.use('/', routes);

/**
 * 404 Handler
 */
app.use(notFoundHandler);

/**
 * Error Handler (must be last)
 */
app.use(errorHandler);

/**
 * Server Startup
 */
const startServer = async () => {
  try {
    // Initialize database
    logger.info('🔄 Initializing database connection...');
    await db.initializePool();

    // Create tables
    logger.info('🔄 Creating database tables...');
    await db.initializeTables();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════╗
║   🚀 Attendance Backend Server Started         ║
╠════════════════════════════════════════════════╣
║   URL: http://localhost:${PORT.toString().padEnd(27)} ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(33)} ║
║   Database: Connected ✓                        ║
║   Tables: Initialized ✓                        ║
╠════════════════════════════════════════════════╣
║   GET  /health       - Health check           ║
║   GET  /db-test      - Database test          ║
║   GET  /db-status    - Database status        ║
╚════════════════════════════════════════════════╝
      `);
    });

    /**
     * Graceful Shutdown
     */
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received: shutting down gracefully...');
      server.close(async () => {
        await db.closePool();
        logger.info('Server shut down');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received: shutting down gracefully...');
      server.close(async () => {
        await db.closePool();
        logger.info('Server shut down');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
