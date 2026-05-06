const mysql  = require('mysql2/promise');
const logger = require('../utils/logger');

// MYSQL_URL is the single source of truth for DB connection.
// Set it in Railway / Render dashboard.
// Format: mysql://user:password@host:port/database
const url = new URL(process.env.MYSQL_URL);

const pool = mysql.createPool({
  host:     url.hostname,
  user:     decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  port:     parseInt(url.port, 10) || 3306,

  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     10000,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 10000,
  charset:   'utf8mb4',
  timezone:  'Z',

  // Managed MySQL on Clever Cloud / Railway / Render uses TLS
  ssl: { rejectUnauthorized: false }
});

logger.info(`Database: connecting to ${url.hostname}:${url.port || 3306}/${url.pathname.replace(/^\//, '')}`);

module.exports = {
  pool,
  query:         (sql, params = []) => pool.execute(sql, params),
  getConnection: ()                 => pool.getConnection(),
  end:           ()                 => pool.end()
};
