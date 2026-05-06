const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const utcToday = () => new Date().toISOString().slice(0, 10);

const ReportsController = {
  /**
   * GET /reports/summary
   * System-wide snapshot: user counts and today's check-in activity.
   */
  getSummary: async (req, res, next) => {
    try {
      const today = utcToday();

      // Run four lightweight COUNT queries — each hits an indexed column
      const [{ total_users }] = await query(
        'SELECT COUNT(*) AS total_users FROM users',
        []
      );

      const [{ total_attendance_records }] = await query(
        'SELECT COUNT(*) AS total_attendance_records FROM attendance',
        []
      );

      const [{ today_checkins_count }] = await query(
        'SELECT COUNT(*) AS today_checkins_count FROM attendance WHERE date = ?',
        [today]
      );

      // Active = checked in but session still open (no check_out yet)
      const [{ active_users_today }] = await query(
        `SELECT COUNT(*) AS active_users_today
         FROM attendance WHERE date = ? AND check_out IS NULL`,
        [today]
      );

      res.status(200).json({
        success: true,
        data: {
          total_users: Number(total_users),
          total_attendance_records: Number(total_attendance_records),
          today_checkins_count: Number(today_checkins_count),
          active_users_today: Number(active_users_today),
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('getSummary failed', error.message);
      next(error);
    }
  },

  /**
   * GET /reports/user/:user_id
   * Lifetime attendance statistics for a single user.
   */
  getUserReport: async (req, res, next) => {
    try {
      const userId = parseInt(req.params.user_id, 10);

      if (!Number.isInteger(userId) || userId < 1) {
        return next(new AppError('user_id must be a positive integer', 400));
      }

      const [user] = await query(
        'SELECT id, name, email FROM users WHERE id = ?',
        [userId]
      );
      if (!user) {
        return next(new AppError(`User ${userId} not found`, 404));
      }

      // Single aggregation pass over the user's attendance history.
      // COALESCE guards against NULL when the user has no completed sessions.
      // duration_hours is DECIMAL — mysql2 returns it as a string, so we parseFloat.
      const [stats] = await query(
        `SELECT
           COUNT(*)                          AS total_days_worked,
           COALESCE(SUM(duration_hours), 0)  AS total_hours_worked,
           MAX(check_in)                     AS last_check_in,
           MAX(check_out)                    AS last_check_out
         FROM attendance
         WHERE user_id = ?`,
        [userId]
      );

      res.status(200).json({
        success: true,
        data: {
          user: { id: user.id, name: user.name, email: user.email },
          stats: {
            total_days_worked: Number(stats.total_days_worked),
            total_hours_worked: parseFloat(stats.total_hours_worked) || 0,
            last_check_in: stats.last_check_in || null,
            last_check_out: stats.last_check_out || null
          }
        }
      });
    } catch (error) {
      logger.error('getUserReport failed', error.message);
      next(error);
    }
  }
};

module.exports = ReportsController;
