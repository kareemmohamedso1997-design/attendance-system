const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Always work in UTC so the date boundary is consistent regardless of where
// the server or the Clever Cloud MySQL host is physically located.
const utcToday = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

const AttendanceController = {
  /**
   * POST /attendance/check-in
   * Open a new attendance session for today.
   * One session per user per day is enforced.
   */
  checkIn: async (req, res, next) => {
    try {
      const userId = parseInt(req.body.user_id, 10);

      if (!Number.isInteger(userId) || userId < 1) {
        return next(new AppError('user_id must be a positive integer', 400));
      }

      // Confirm user exists before writing attendance
      const [user] = await query(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      if (!user) {
        return next(new AppError(`User ${userId} not found`, 404));
      }

      const today = utcToday();

      // One check-in per day — reject if a record for today already exists
      const [existing] = await query(
        'SELECT id FROM attendance WHERE user_id = ? AND date = ?',
        [userId, today]
      );
      if (existing) {
        return next(new AppError('Already checked in today', 409));
      }

      const now = new Date();

      const result = await query(
        'INSERT INTO attendance (user_id, check_in, date) VALUES (?, ?, ?)',
        [userId, now, today]
      );

      const [record] = await query(
        `SELECT id, user_id, check_in, check_out, date, duration_hours
         FROM attendance WHERE id = ?`,
        [result.insertId]
      );

      logger.info('Check-in recorded', `user_id=${userId} date=${today}`);

      res.status(201).json({
        success: true,
        message: 'Check-in recorded successfully',
        data: record
      });
    } catch (error) {
      logger.error('checkIn failed', error.message);
      next(error);
    }
  },

  /**
   * POST /attendance/check-out
   * Close today's open session and persist the duration in hours.
   */
  checkOut: async (req, res, next) => {
    try {
      const userId = parseInt(req.body.user_id, 10);

      if (!Number.isInteger(userId) || userId < 1) {
        return next(new AppError('user_id must be a positive integer', 400));
      }

      const today = utcToday();

      // Fetch today's record — we need check_in to compute duration
      const [record] = await query(
        `SELECT id, check_in, check_out
         FROM attendance WHERE user_id = ? AND date = ?`,
        [userId, today]
      );

      if (!record) {
        return next(new AppError('No check-in found for today. Please check in first.', 404));
      }

      if (record.check_out) {
        return next(new AppError('Already checked out for today', 409));
      }

      const now = new Date();

      // mysql2 with timezone:'Z' returns DATETIME columns as JS Date objects
      const durationMs = now - new Date(record.check_in);
      const durationHours = parseFloat((durationMs / 36e5).toFixed(2)); // 36e5 = ms per hour

      await query(
        'UPDATE attendance SET check_out = ?, duration_hours = ? WHERE id = ?',
        [now, durationHours, record.id]
      );

      const [updated] = await query(
        `SELECT id, user_id, check_in, check_out, date, duration_hours
         FROM attendance WHERE id = ?`,
        [record.id]
      );

      logger.info('Check-out recorded', `user_id=${userId} duration=${durationHours}h`);

      res.status(200).json({
        success: true,
        message: 'Check-out recorded successfully',
        data: updated
      });
    } catch (error) {
      logger.error('checkOut failed', error.message);
      next(error);
    }
  },

  /**
   * GET /attendance/user/:user_id
   * All attendance records for one user, newest first.
   */
  getUserAttendance: async (req, res, next) => {
    try {
      const userId = parseInt(req.params.user_id, 10);

      if (!Number.isInteger(userId) || userId < 1) {
        return next(new AppError('user_id must be a positive integer', 400));
      }

      const [user] = await query(
        'SELECT id, name FROM users WHERE id = ?',
        [userId]
      );
      if (!user) {
        return next(new AppError(`User ${userId} not found`, 404));
      }

      const records = await query(
        `SELECT id, user_id, check_in, check_out, date, duration_hours, created_at
         FROM attendance
         WHERE user_id = ?
         ORDER BY date DESC, check_in DESC`,
        [userId]
      );

      res.status(200).json({
        success: true,
        user: { id: user.id, name: user.name },
        count: records.length,
        data: records
      });
    } catch (error) {
      logger.error('getUserAttendance failed', error.message);
      next(error);
    }
  },

  /**
   * GET /attendance/today
   * Every attendance record for the current UTC day, with user details joined.
   */
  getTodayAttendance: async (req, res, next) => {
    try {
      const today = utcToday();

      const records = await query(
        `SELECT a.id, a.user_id, u.name, u.email,
                a.check_in, a.check_out, a.date, a.duration_hours
         FROM attendance a
         JOIN users u ON a.user_id = u.id
         WHERE a.date = ?
         ORDER BY a.check_in DESC`,
        [today]
      );

      res.status(200).json({
        success: true,
        date: today,
        count: records.length,
        data: records
      });
    } catch (error) {
      logger.error('getTodayAttendance failed', error.message);
      next(error);
    }
  }
};

module.exports = AttendanceController;
