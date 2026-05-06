const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const path        = require('path');
const fs          = require('fs');

const errorHandler             = require('./middleware/errorHandler');
const { generalLimiter }       = require('./middleware/rateLimitMiddleware');
const logger                   = require('./utils/logger');

const authRoutes       = require('./routes/authRoutes');
const userRoutes       = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes     = require('./routes/reportRoutes');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression({ threshold: 1024 }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '*')
  .split(',').map(o => o.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

// ── Rate limiting on all /api/* routes ────────────────────────────────────────
app.use('/api/', generalLimiter);

// ── Static files (PWA client) ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../client'), {
  setHeaders(res, filePath) {
    if (/\.(html)$/.test(filePath) || filePath.endsWith('service-worker.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (/\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    } else if (/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    }
  }
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status:      'ok',
      environment: process.env.NODE_ENV || 'development',
      timestamp:   new Date().toISOString()
    }
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports',    reportRoutes);

// ── Frontend page routes ──────────────────────────────────────────────────────
const CLIENT_DIR = path.join(__dirname, '../client');

function serveClientPage(page) {
  return (req, res) => {
    const filePath = path.join(CLIENT_DIR, page);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.json({ success: true, message: 'Attendance System API is running', docs: '/api/health' });
    }
  };
}

app.get('/',      serveClientPage('index.html'));
app.get('/admin', serveClientPage('admin.html'));
app.get('/login', serveClientPage('login.html'));

// ── 404 — must be AFTER all routes ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      statusCode: 404,
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// ── Global error handler — must be last ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
