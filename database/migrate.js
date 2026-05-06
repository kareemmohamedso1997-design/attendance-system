/**
 * Production Migration Runner
 *
 * Applies schema.sql to the configured database WITHOUT the
 * "CREATE DATABASE" and "USE" directives that are meant for local setup only.
 *
 * Usage:
 *   # Local (uses .env):
 *   node database/migrate.js
 *
 *   # Railway shell (MYSQL_URL is already in the environment):
 *   node database/migrate.js
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../server/config/database');

async function migrate() {
  console.log('='.repeat(52));
  console.log('  Attendance System — Database Migration');
  console.log('='.repeat(52));

  const schemaPath = path.join(__dirname, 'schema.sql');
  let raw = fs.readFileSync(schemaPath, 'utf8');

  // Remove all comments (both /* */ and --)
  // This is more robust than trying to preserve formatting
  raw = raw
    .replace(/\/\*[\s\S]*?\*\//gm, '')  // Remove /* */ comments
    .split('\n')
    .map(line => {
      // Remove -- comments from each line
      const commentIdx = line.indexOf('--');
      return commentIdx >= 0 ? line.substring(0, commentIdx) : line;
    })
    .join('\n');

  // Split on semicolons and clean up statements
  const statements = raw
    .split(';')
    .map(s => s.trim())
    .map(s => s.replace(/\s+/g, ' ')) // Normalize whitespace
    .filter(s => s.length > 0)
    .filter(s => !/^CREATE\s+DATABASE/i.test(s))
    .filter(s => !/^USE\s+/i.test(s));

  const conn = await db.getConnection();

  try {
    let ok = 0;
    let skipped = 0;

    for (const sql of statements) {
      try {
        await conn.query(sql);
        ok++;
      } catch (err) {
        // ER_TABLE_EXISTS_ERROR is fine — table was already created
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          skipped++;
        } else {
          throw err;
        }
      }
    }

    console.log(`\n  Statements executed : ${ok}`);
    console.log(`  Tables already existed: ${skipped}`);
    console.log('\n  Migration complete.\n');
  } finally {
    conn.release();
    await db.pool.end();
  }
}

migrate().catch(err => {
  console.error('\n  Migration FAILED:', err.message);
  process.exit(1);
});
