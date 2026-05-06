const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Fail fast if required env vars are missing
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[DB] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT, 10) || 10,
  queueLimit: 0,
  connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: { rejectUnauthorized: false }
};

let pool = null;

const initializePool = async () => {
  if (pool) return pool;

  try {
    logger.debug('Initializing MySQL connection pool...');
    pool = mysql.createPool(dbConfig);

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info(`✓ MySQL pool connected → ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    return pool;
  } catch (error) {
    logger.error('✗ Failed to initialize MySQL connection pool', error.message);
    process.exit(1);
  }
};

const getConnection = async () => {
  if (!pool) await initializePool();
  return pool.getConnection();
};

const query = async (sql, values = []) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(sql, values);
    return results;
  } catch (error) {
    logger.error('Database query failed', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const initializeTables = async () => {
  try {
    logger.info('Initializing database tables...');

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        check_in DATETIME NOT NULL,
        check_out DATETIME,
        date DATE NOT NULL,
        duration_hours DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_attendance_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_date (date),
        INDEX idx_check_in (check_in)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    logger.info('✓ Database tables initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize tables', error.message);
    throw error;
  }
};

const closePool = async () => {
  if (!pool) return;
  try {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', error.message);
  }
};

const testConnection = async () => {
  let connection;
  try {
    connection = await getConnection();
    await connection.query('SELECT 1');
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { initializePool, getConnection, query, initializeTables, closePool, testConnection };
