/**
 * Logger Utility
 *
 * - Always writes INFO/WARN/ERROR to stdout/stderr so Railway (and any
 *   other PaaS) captures them via its log aggregator.
 * - Optionally also appends to a rotating daily file when ENABLE_AUDIT_LOG=true
 *   (useful for local dev; in production prefer Railway's built-in log viewer).
 */

const fs   = require('fs');
const path = require('path');

const IS_PROD        = process.env.NODE_ENV === 'production';
const AUDIT_LOG      = process.env.ENABLE_AUDIT_LOG === 'true';
const LOG_LEVEL      = (process.env.LOG_LEVEL || 'info').toLowerCase();

const LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 };
const minRank    = LEVEL_RANK[LOG_LEVEL] ?? 1;

// Only create the logs directory when file logging is enabled.
const logDir = path.join(__dirname, '../../logs');
if (AUDIT_LOG && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function formatLog(level, message, data) {
  const ts  = new Date().toISOString();
  const tag = level.toUpperCase().padEnd(5);
  let line  = `[${ts}] [${tag}] ${message}`;
  if (data !== undefined && data !== null) {
    line += ` | ${JSON.stringify(data)}`;
  }
  return line;
}

function writeToFile(line) {
  const filename = path.join(logDir, `attendance-${new Date().toISOString().split('T')[0]}.log`);
  try {
    fs.appendFileSync(filename, line + '\n');
  } catch {
    // Silently ignore — file write failure must not crash the process
  }
}

function log(level, message, data) {
  if ((LEVEL_RANK[level] ?? 0) < minRank) return;

  const line = formatLog(level, message, data);

  // Always emit to stdout/stderr — Railway captures this
  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }

  if (AUDIT_LOG) {
    writeToFile(line);
  }
}

const logger = {
  debug: (message, data) => log('debug', message, data),
  info:  (message, data) => log('info',  message, data),
  warn:  (message, data) => log('warn',  message, data),
  error: (message, data) => log('error', message, data)
};

module.exports = logger;
