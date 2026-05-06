/**
 * Logger Utility
 * Simple logging utility with different levels
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'   // Reset
};

const getCurrentLevel = () => {
  const env = process.env.LOG_LEVEL || 'info';
  return env.toUpperCase();
};

const shouldLog = (level) => {
  const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  const currentLevel = getCurrentLevel();
  return levels.indexOf(level) <= levels.indexOf(currentLevel);
};

const formatLog = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const color = LOG_COLORS[level] || '';
  const reset = LOG_COLORS.RESET;
  return `${color}[${timestamp}] [${level}]${reset} ${message} ${meta}`;
};

const logger = {
  error: (message, meta = '') => {
    if (shouldLog('ERROR')) {
      console.error(formatLog('ERROR', message, meta));
    }
  },

  warn: (message, meta = '') => {
    if (shouldLog('WARN')) {
      console.warn(formatLog('WARN', message, meta));
    }
  },

  info: (message, meta = '') => {
    if (shouldLog('INFO')) {
      console.log(formatLog('INFO', message, meta));
    }
  },

  debug: (message, meta = '') => {
    if (shouldLog('DEBUG')) {
      console.log(formatLog('DEBUG', message, meta));
    }
  }
};

module.exports = logger;
