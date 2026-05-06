require('dotenv').config();
const db = require('../server/config/database');

async function inspect() {
  const [tables] = await db.query('SHOW TABLES');
  console.log('=== TABLES IN DATABASE ===');
  if (tables.length === 0) { console.log('  (no tables found)'); }
  tables.forEach(t => console.log(' -', Object.values(t)[0]));

  for (const row of tables) {
    const name = Object.values(row)[0];
    const [cols] = await db.query('DESCRIBE `' + name + '`');
    console.log('\n--- ' + name + ' ---');
    cols.forEach(c =>
      console.log('  ' + String(c.Field).padEnd(30) + String(c.Type).padEnd(25) + (c.Key ? '[' + c.Key + ']' : ''))
    );
  }

  // Row counts
  console.log('\n=== ROW COUNTS ===');
  for (const row of tables) {
    const name = Object.values(row)[0];
    const [[cnt]] = await db.query('SELECT COUNT(*) AS n FROM `' + name + '`');
    console.log('  ' + String(name).padEnd(30) + cnt.n + ' rows');
  }

  await db.pool.end();
}

inspect().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
