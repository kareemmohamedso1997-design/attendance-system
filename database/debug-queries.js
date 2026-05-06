require('dotenv').config();
const db = require('../server/config/database');

async function run() {
  console.log('--- Query 1: getAttendance COUNT ---');
  try {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE 1=1`
    );
    console.log('total =', total, '(type:', typeof total, ')');
  } catch (e) { console.error('FAIL:', e.message); }

  console.log('\n--- Query 2: getAttendance SELECT (LIMIT embedded) ---');
  try {
    const [records] = await db.query(
      `SELECT a.id, e.id AS employee_id, e.name AS employee_name,
              a.check_in, a.check_out, a.working_hours, a.overtime_hours,
              a.is_late, a.is_locked
       FROM attendance a JOIN employees e ON a.employee_id = e.id
       WHERE 1=1
       ORDER BY a.check_in DESC
       LIMIT 20 OFFSET 0`,
      []
    );
    console.log('rows =', records.length);
  } catch (e) { console.error('FAIL:', e.message); }

  console.log('\n--- Query 3: getStatistics ---');
  try {
    const [[stats]] = await db.query(
      `SELECT
         COUNT(DISTINCT DATE(a.check_in))  AS total_days,
         SUM(IF(a.is_late, 1, 0))          AS late_days,
         COALESCE(SUM(a.working_hours), 0) AS total_working_hours,
         COALESCE(AVG(a.working_hours), 0) AS avg_working_hours,
         COALESCE(SUM(a.overtime_hours),0) AS total_overtime_hours
       FROM attendance a
       WHERE a.check_out IS NOT NULL`
    );
    console.log('stats =', stats);
  } catch (e) { console.error('FAIL:', e.message); }

  console.log('\n--- Query 4: getUserAttendance (id=1) ---');
  try {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM attendance WHERE employee_id = ?`, [1]
    );
    console.log('total =', total);
    const [records] = await db.query(
      `SELECT a.id, a.employee_id, e.name AS employee_name,
              a.check_in, a.check_out, a.working_hours,
              a.overtime_hours, a.is_late, a.is_locked
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.employee_id = ?
       ORDER BY a.check_in DESC
       LIMIT 20 OFFSET 0`,
      [1]
    );
    console.log('rows =', records.length);
  } catch (e) { console.error('FAIL:', e.message); }

  await db.pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
