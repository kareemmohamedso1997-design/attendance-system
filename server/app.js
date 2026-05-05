const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const path        = require('path');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimitMiddleware');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize Express app
const app = express();

/**
 * Security Middleware
 */
app.use(helmet());

/**
 * Compression — gzip all responses ≥ 1 KB
 */
app.use(compression({ threshold: 1024 }));

/**
 * CORS Configuration
 */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',').map(o => o.trim());

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server requests (no Origin header) and listed origins
    if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Request Logging
 */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * Rate Limiting
 */
app.use('/api/', generalLimiter);

/**
 * Serve Static Files
 * - HTML and service-worker: no-cache (always revalidate)
 * - JS / CSS: 1 week (PWA service worker takes over after first load)
 * - Images / fonts: 30 days
 */
app.use(express.static(path.join(__dirname, '../client'), {
  setHeaders(res, filePath) {
    if (/\.(html)$/.test(filePath) || filePath.endsWith('service-worker.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (/\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');   // 7 days
    } else if (/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');  // 30 days
    }
  }
}));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

/**
 * Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Serve HTML Pages
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

/**
 * Global Error Handler (Must be last)
 */
app.use(errorHandler);

module.exports = app;
