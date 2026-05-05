const mysql  = require('mysql2/promise');
const logger = require('../utils/logger');

// ─── Resolve connection config ────────────────────────────────────────────────
// Railway injects MYSQL_URL automatically when a MySQL service is linked.
// Fall back to individual DB_* variables for local development.

let poolConfig;

if (process.env.MYSQL_URL) {
  const url = new URL(process.env.MYSQL_URL);
  poolConfig = {
    host:     url.hostname,
    user:     decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    port:     parseInt(url.port, 10) || 3306,
  };
  logger.info('Database: using MYSQL_URL connection string');
} else {
  poolConfig = {
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'attendance_db',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
  };
}

const pool = mysql.createPool({
  ...poolConfig,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:     true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  // Railway MySQL uses SSL with a self-signed cert; disable strict verification.
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined
});

module.exports = {
  pool,
  query:         (sql, params = []) => pool.execute(sql, params),
  getConnection: ()                 => pool.getConnection(),
  end:           ()                 => pool.end()
};
