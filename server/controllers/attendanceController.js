/**
 * Attendance Controller
 * Handles check-in, check-out, and attendance queries.
 *
 * Security / integrity guarantees:
 *  - Employees can only act on their own record (JWT-enforced).
 *  - Duplicate open sessions are prevented with a database transaction +
 *    INSERT … SELECT WHERE NOT EXISTS, making the check-and-insert atomic.
 *  - Records are locked (is_locked = 1) after checkout.
 *  - Sessions older than MAX_SESSION_HOURS are rejected at checkout to catch
 *    forgotten check-ins before they produce nonsense durations.
 */

const db = require('../config/database');
const AppError = require('../utils/AppError');
const { isLocationWithinRadius, calculateDistance } = require('../utils/validators');
const logger = require('../utils/logger');

const MAX_SESSION_HOURS = parseInt(process.env.MAX_SESSION_HOURS) || 24;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the employee ID for an action.
 * Regular employees always use their own ID from the JWT.
 * Admins may override with a body-supplied ID.
 */
function resolveEmployeeId(req) {
  if (req.user.role === 'admin') {
    return req.body.employee_id || req.user.employeeId;
  }
  return req.user.employeeId;
}

// ─── GPS helpers ─────────────────────────────────────────────────────────────

/**
 * Resolve the office coordinates and radius to use for a geofencing check.
 * Per-employee settings take priority; global .env values are the fallback.
 * Returns null if no coordinates are configured at all.
 */
function resolveOfficeLocation(employee) {
  const lat    = employee.allowed_latitude    || parseFloat(process.env.OFFICE_LATITUDE);
  const lon    = employee.allowed_longitude   || parseFloat(process.env.OFFICE_LONGITUDE);
  const radius = employee.allowed_location_radius
    || parseFloat(process.env.OFFICE_RADIUS_METERS)
    || 200;

  if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon, radius };
}

// ─── Check In ────────────────────────────────────────────────────────────────

const checkIn = async (req, res, next) => {
  const { latitude, longitude, accuracy } = req.body;
  const employee_id = resolveEmployeeId(req);

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // ── 1. Employee must exist and be active ──────────────────────────────
    const [[employee]] = await conn.execute(
      `SELECT id, name, status,
              allowed_latitude, allowed_longitude, allowed_location_radius
       FROM employees WHERE id = ?`,
      [employee_id]
    );

    if (!employee) {
      await conn.rollback();
      return next(new AppError('Employee not found.', 404));
    }

    if (employee.status !== 'active') {
      await conn.rollback();
      return next(new AppError('Your account is inactive. Please contact HR.', 403));
    }

    // ── 2. Require location (if configured) ───────────────────────────────
    if (process.env.REQUIRE_LOCATION_FOR_CHECKIN === 'true') {
      if (latitude == null || longitude == null) {
        await conn.rollback();
        return next(new AppError(
          'GPS location is required for check-in. Please allow location access in your browser.',
          400
        ));
      }
    }

    // ── 3. GPS accuracy gate ──────────────────────────────────────────────
    // Reject if the browser reports a fix that is too imprecise.
    const gpsMaxAccuracy = parseFloat(process.env.GPS_MAX_ACCURACY) || 50;
    if (accuracy != null && parseFloat(accuracy) > gpsMaxAccuracy) {
      await conn.rollback();
      return next(new AppError(
        `GPS accuracy is too low (±${Math.round(accuracy)} m). ` +
        `Check-in requires ≤${gpsMaxAccuracy} m. ` +
        `Move outdoors or wait for a stronger signal, then try again.`,
        422
      ));
    }

    // ── 4. Geofencing (if enabled) ────────────────────────────────────────
    // Separate from the "require location" check — you can require coordinates
    // for record-keeping without enforcing a physical radius.
    let distanceFromOffice = null;

    if (latitude != null && longitude != null && process.env.ENABLE_GEOFENCING === 'true') {
      const office = resolveOfficeLocation(employee);

      if (!office) {
        logger.warn('ENABLE_GEOFENCING=true but no office coordinates are configured — skipping check');
      } else {
        distanceFromOffice = Math.round(calculateDistance(latitude, longitude, office.lat, office.lon));

        if (distanceFromOffice > office.radius) {
          await conn.rollback();
          logger.warn(
            `Employee ${employee_id} geofence violation: ${distanceFromOffice}m from office (limit ${office.radius}m)`
          );
          return next(new AppError(
            `You are ${distanceFromOffice}m from the office. Check-in is only allowed within ${office.radius}m.`,
            403
          ));
        }
      }
    }

    // ── 4. Atomic duplicate-session check + insert ────────────────────────
    const now = new Date();

    const [result] = await conn.execute(
      `INSERT INTO attendance (employee_id, check_in, check_in_latitude, check_in_longitude)
       SELECT ?, ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM attendance
         WHERE employee_id = ? AND check_out IS NULL
       )`,
      [employee_id, now, latitude ?? null, longitude ?? null, employee_id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return next(new AppError('You already have an active check-in. Please check out first.', 409));
    }

    const attendanceId = result.insertId;

    // ── 5. Log GPS location with accuracy (separate history table) ────────
    if (latitude != null && longitude != null) {
      await conn.execute(
        `INSERT INTO attendance_locations
           (attendance_id, latitude, longitude, accuracy, event_type, ip_address, user_agent)
         VALUES (?, ?, ?, ?, 'check_in', ?, ?)`,
        [attendanceId, latitude, longitude, accuracy ?? null, req.ip, req.get('user-agent') ?? null]
      );
    }

    await conn.commit();
    logger.info(
      `Employee ${employee_id} (${employee.name}) checked in at ${now.toISOString()}` +
      (distanceFromOffice != null ? ` — ${distanceFromOffice}m from office` : '')
    );

    return res.status(201).json({
      status:  'success',
      message: 'Checked in successfully.',
      data: {
        attendance_id: attendanceId,
        check_in:      now.toISOString(),
        location: latitude != null ? {
          latitude,
          longitude,
          accuracy:             accuracy ?? null,
          distance_from_office: distanceFromOffice
        } : null
      }
    });

  } catch (error) {
    await conn.rollback();
    return next(error);
  } finally {
    conn.release();
  }
};

// ─── Check Out ───────────────────────────────────────────────────────────────

const checkOut = async (req, res, next) => {
  const { latitude, longitude, accuracy } = req.body;
  const employee_id = resolveEmployeeId(req);

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // ── 1. Find the open session ──────────────────────────────────────────
    const [[attendance]] = await conn.execute(
      `SELECT id, check_in, is_locked
       FROM attendance
       WHERE employee_id = ? AND check_out IS NULL
       LIMIT 1
       FOR UPDATE`,
      [employee_id]
    );

    if (!attendance) {
      await conn.rollback();
      return next(new AppError('No active check-in found. Please check in first.', 400));
    }

    if (attendance.is_locked) {
      await conn.rollback();
      return next(new AppError('This attendance record is locked and cannot be modified.', 409));
    }

    // ── 2. Session duration sanity check ─────────────────────────────────
    const checkInTime  = new Date(attendance.check_in);
    const checkOutTime = new Date();
    const sessionHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    if (sessionHours > MAX_SESSION_HOURS) {
      await conn.rollback();
      return next(new AppError(
        `Session is over ${MAX_SESSION_HOURS} hours old. Please contact an administrator to close it manually.`,
        409
      ));
    }

    // ── 2b. GPS accuracy gate ─────────────────────────────────────────────
    const gpsMaxAccuracyOut = parseFloat(process.env.GPS_MAX_ACCURACY) || 50;
    if (accuracy != null && parseFloat(accuracy) > gpsMaxAccuracyOut) {
      await conn.rollback();
      return next(new AppError(
        `GPS accuracy is too low (±${Math.round(accuracy)} m). ` +
        `Check-out requires ≤${gpsMaxAccuracyOut} m. ` +
        `Move outdoors or wait for a stronger signal, then try again.`,
        422
      ));
    }

    // ── 3. Calculate durations ────────────────────────────────────────────
    const workHoursPerDay = parseFloat(process.env.WORK_HOURS_PER_DAY) || 8;
    const workingHours    = sessionHours;
    const overtimeHours   = Math.max(0, workingHours - workHoursPerDay);

    const [lateHour, lateMinute] = (process.env.LATE_TIME || '09:00').split(':').map(Number);
    const isLate = (
      checkInTime.getHours() > lateHour ||
      (checkInTime.getHours() === lateHour && checkInTime.getMinutes() > lateMinute)
    ) ? 1 : 0;

    // ── 4. Close the record and lock it ──────────────────────────────────
    await conn.execute(
      `UPDATE attendance
       SET check_out           = ?,
           check_out_latitude  = ?,
           check_out_longitude = ?,
           working_hours       = ?,
           overtime_hours      = ?,
           is_late             = ?,
           is_locked           = 1
       WHERE id = ?`,
      [
        checkOutTime,
        latitude  ?? null,
        longitude ?? null,
        parseFloat(workingHours.toFixed(2)),
        parseFloat(overtimeHours.toFixed(2)),
        isLate,
        attendance.id
      ]
    );

    // ── 5. Log GPS location with accuracy ─────────────────────────────────
    if (latitude != null && longitude != null) {
      await conn.execute(
        `INSERT INTO attendance_locations
           (attendance_id, latitude, longitude, accuracy, event_type, ip_address, user_agent)
         VALUES (?, ?, ?, ?, 'check_out', ?, ?)`,
        [attendance.id, latitude, longitude, accuracy ?? null, req.ip, req.get('user-agent') ?? null]
      );
    }

    await conn.commit();
    logger.info(`Employee ${employee_id} checked out at ${checkOutTime.toISOString()} — ${workingHours.toFixed(2)} hrs`);

    return res.json({
      status:  'success',
      message: 'Checked out successfully.',
      data: {
        attendance_id:  attendance.id,
        check_in:       attendance.check_in,
        check_out:      checkOutTime.toISOString(),
        working_hours:  parseFloat(workingHours.toFixed(2)),
        overtime_hours: parseFloat(overtimeHours.toFixed(2)),
        is_late:        isLate,
        location: latitude != null ? {
          latitude,
          longitude,
          accuracy: accuracy ?? null
        } : null
      }
    });

  } catch (error) {
    await conn.rollback();
    return next(error);
  } finally {
    conn.release();
  }
};

// ─── Get Attendance Records ───────────────────────────────────────────────────

const getAttendance = async (req, res, next) => {
  try {
    const { employee_id, from_date, to_date } = req.query;
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    // Build shared WHERE clause so both COUNT and SELECT use identical filters
    let where = 'WHERE 1=1';
    const whereParams = [];

    if (req.user.role === 'employee') {
      where += ' AND a.employee_id = ?';
      whereParams.push(req.user.employeeId);
    } else if (employee_id) {
      where += ' AND a.employee_id = ?';
      whereParams.push(parseInt(employee_id));
    }

    if (from_date) { where += ' AND DATE(a.check_in) >= ?'; whereParams.push(from_date); }
    if (to_date)   { where += ' AND DATE(a.check_in) <= ?'; whereParams.push(to_date);   }

    const BASE = 'FROM attendance a JOIN employees e ON a.employee_id = e.id';

    // Total matching rows (for pagination)
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total ${BASE} ${where}`,
      whereParams
    );

    // Page of records
    const [records] = await db.query(
      `SELECT a.id, e.id AS employee_id, e.name AS employee_name,
              a.check_in, a.check_out, a.working_hours, a.overtime_hours,
              a.is_late, a.is_locked
       ${BASE} ${where}
       ORDER BY a.check_in DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset]
    );

    return res.json({ status: 'success', data: records, count: records.length, total });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Today's Attendance ───────────────────────────────────────────────────

const getTodayAttendance = async (req, res, next) => {
  try {
    let sql = `
      SELECT a.id, e.id AS employee_id, e.name AS employee_name,
             a.check_in, a.check_out, a.working_hours, a.overtime_hours, a.is_late
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE DATE(a.check_in) = CURDATE()
    `;
    const params = [];

    if (req.user.role === 'employee') {
      sql += ' AND a.employee_id = ?';
      params.push(req.user.employeeId);
    }

    sql += ' ORDER BY a.check_in ASC';

    const [records] = await db.query(sql, params);
    return res.json({ status: 'success', data: records, count: records.length });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Employees List ───────────────────────────────────────────────────────

const getEmployees = async (req, res, next) => {
  try {
    const [employees] = await db.query(
      `SELECT id, name, email, department, position
       FROM employees
       WHERE status = 'active'
       ORDER BY name ASC`
    );
    return res.json({ status: 'success', data: employees, count: employees.length });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Statistics ───────────────────────────────────────────────────────────

const getStatistics = async (req, res, next) => {
  try {
    const { employee_id, from_date, to_date } = req.query;

    let sql = `
      SELECT
        COUNT(DISTINCT DATE(a.check_in))  AS total_days,
        SUM(IF(a.is_late, 1, 0))          AS late_days,
        COALESCE(SUM(a.working_hours), 0) AS total_working_hours,
        COALESCE(AVG(a.working_hours), 0) AS avg_working_hours,
        COALESCE(SUM(a.overtime_hours),0) AS total_overtime_hours
      FROM attendance a
      WHERE a.check_out IS NOT NULL
    `;
    const params = [];

    if (req.user.role === 'employee') {
      sql += ' AND a.employee_id = ?';
      params.push(req.user.employeeId);
    } else if (employee_id) {
      sql += ' AND a.employee_id = ?';
      params.push(employee_id);
    }

    if (from_date) { sql += ' AND DATE(a.check_in) >= ?'; params.push(from_date); }
    if (to_date)   { sql += ' AND DATE(a.check_in) <= ?'; params.push(to_date);   }

    const [[stats]] = await db.query(sql, params);

    return res.json({
      status: 'success',
      data: {
        total_days:           stats.total_days          || 0,
        late_days:            stats.late_days           || 0,
        total_working_hours:  parseFloat((stats.total_working_hours  || 0).toFixed(2)),
        avg_working_hours:    parseFloat((stats.avg_working_hours    || 0).toFixed(2)),
        total_overtime_hours: parseFloat((stats.total_overtime_hours || 0).toFixed(2))
      }
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Current Status ───────────────────────────────────────────────────────

const getCurrentStatus = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const [[record]] = await db.query(
      `SELECT id, check_in, check_out
       FROM attendance
       WHERE employee_id = ?
       ORDER BY check_in DESC
       LIMIT 1`,
      [employeeId]
    );

    if (!record) {
      return res.json({
        status: 'success',
        data: { is_checked_in: false, current_status: 'Not checked in', check_in: null, check_out: null }
      });
    }

    return res.json({
      status: 'success',
      data: {
        is_checked_in:  !record.check_out,
        current_status: record.check_out ? 'Checked out' : 'Checked in',
        check_in:       record.check_in,
        check_out:      record.check_out
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getTodayAttendance,
  getEmployees,
  getStatistics,
  getCurrentStatus
};
