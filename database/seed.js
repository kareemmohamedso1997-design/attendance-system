/**
 * Database Seed Script
 * Generates bcrypt password hashes and sets them for all users.
 *
 * Run once after importing schema.sql:
 *   node database/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../server/config/database');

async function seed() {
  console.log('Running database seed...\n');

  const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const adminPassword = 'Admin123';
  const employeePassword = 'Password123';

  console.log('Hashing passwords (this takes a moment)...');
  const [adminHash, employeeHash] = await Promise.all([
    bcrypt.hash(adminPassword, ROUNDS),
    bcrypt.hash(employeePassword, ROUNDS)
  ]);
  console.log('Done.\n');

  // Set admin password (role_id = 1)
  const [adminResult] = await db.query(
    'UPDATE users SET password_hash = ? WHERE role_id = 1',
    [adminHash]
  );
  console.log(`Admin users updated: ${adminResult.affectedRows}`);

  // Set employee passwords (role_id = 2)
  const [empResult] = await db.query(
    'UPDATE users SET password_hash = ? WHERE role_id = 2',
    [employeeHash]
  );
  console.log(`Employee users updated: ${empResult.affectedRows}`);

  // Show all users for verification
  const [users] = await db.query(
    `SELECT u.username, u.email, r.name as role
     FROM users u JOIN roles r ON u.role_id = r.id
     ORDER BY u.role_id ASC, u.username ASC`
  );

  console.log('\nUsers in database:');
  console.log('-'.repeat(50));
  users.forEach(u => {
    console.log(`  ${u.role.padEnd(10)} | ${u.username.padEnd(20)} | ${u.email}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log('Seed complete! Login credentials:');
  console.log('='.repeat(50));
  console.log(`  Admin:    username=admin       password=${adminPassword}`);
  console.log(`  Employee: username=john.doe    password=${employeePassword}`);
  console.log(`  Employee: username=jane.smith  password=${employeePassword}`);
  console.log('  (all employee accounts share the same demo password)');
  console.log('='.repeat(50));

  await db.pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
