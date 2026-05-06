/**
 * Attendance Model
 * Database operations for attendance records
 */

const db = require('../config/database');
const logger = require('../utils/logger');

const Attendance = {
  /**
   * Record check-in
   */
  checkIn: async (userId, checkInTime = new Date()) => {
    try {
      const date = new Date(checkInTime).toISOString().split('T')[0];

      const result = await db.query(
        'INSERT INTO attendance (user_id, check_in, date) VALUES (?, ?, ?)',
        [userId, checkInTime, date]
      );

      logger.debug(`Check-in recorded for user ${userId}`);
      return { id: result.insertId, user_id: userId, check_in: checkInTime };
    } catch (error) {
      logger.error('Error recording check-in', error.message);
      throw error;
    }
  },

  /**
   * Record check-out
   */
  checkOut: async (attendanceId, checkOutTime = new Date()) => {
    try {
      // Get check-in time to calculate duration
      const attendance = await db.query(
        'SELECT check_in FROM attendance WHERE id = ?',
        [attendanceId]
      );

      if (attendance.length === 0) {
        throw new Error('Attendance record not found');
      }

      const checkInTime = new Date(attendance[0].check_in);
      const checkOutTimeDate = new Date(checkOutTime);
      const durationMs = checkOutTimeDate - checkInTime;
      const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

      await db.query(
        'UPDATE attendance SET check_out = ?, duration_hours = ? WHERE id = ?',
        [checkOutTime, durationHours, attendanceId]
      );

      logger.debug(`Check-out recorded for attendance ${attendanceId}`);
      return { id: attendanceId, check_out: checkOutTime, duration_hours: durationHours };
    } catch (error) {
      logger.error('Error recording check-out', error.message);
      throw error;
    }
  },

  /**
   * Get attendance by ID
   */
  getById: async (attendanceId) => {
    try {
      const result = await db.query(
        'SELECT * FROM attendance WHERE id = ?',
        [attendanceId]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('Error fetching attendance', error.message);
      throw error;
    }
  },

  /**
   * Get attendance records by user
   */
  getByUserId: async (userId, page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;

      const records = await db.query(
        `SELECT a.*, u.name as user_name 
         FROM attendance a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.user_id = ? 
         ORDER BY a.date DESC, a.check_in DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM attendance WHERE user_id = ?',
        [userId]
      );
      const total = countResult[0].count;

      return {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching user attendance', error.message);
      throw error;
    }
  },

  /**
   * Get attendance records by date range
   */
  getByDateRange: async (fromDate, toDate, page = 1, limit = 50) => {
    try {
      const offset = (page - 1) * limit;

      const records = await db.query(
        `SELECT a.*, u.name as user_name 
         FROM attendance a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.date BETWEEN ? AND ? 
         ORDER BY a.date DESC, a.check_in DESC 
         LIMIT ? OFFSET ?`,
        [fromDate, toDate, limit, offset]
      );

      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM attendance WHERE date BETWEEN ? AND ?',
        [fromDate, toDate]
      );
      const total = countResult[0].count;

      return {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching attendance by date range', error.message);
      throw error;
    }
  },

  /**
   * Get today's attendance
   */
  getToday: async (page = 1, limit = 50) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await Attendance.getByDateRange(today, today, page, limit);
    } catch (error) {
      logger.error('Error fetching today attendance', error.message);
      throw error;
    }
  },

  /**
   * Get attendance statistics for a user
   */
  getStatistics: async (userId, fromDate, toDate) => {
    try {
      const result = await db.query(
        `SELECT 
          COUNT(*) as total_days,
          SUM(duration_hours) as total_hours,
          AVG(duration_hours) as avg_hours,
          MIN(check_in) as earliest_checkin,
          MAX(check_out) as latest_checkout
         FROM attendance 
         WHERE user_id = ? AND date BETWEEN ? AND ?`,
        [userId, fromDate, toDate]
      );

      return result[0];
    } catch (error) {
      logger.error('Error fetching attendance statistics', error.message);
      throw error;
    }
  },

  /**
   * Delete attendance record
   */
  delete: async (attendanceId) => {
    try {
      const result = await db.query('DELETE FROM attendance WHERE id = ?', [attendanceId]);

      logger.debug(`Attendance ${attendanceId} deleted`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting attendance', error.message);
      throw error;
    }
  }
};

module.exports = Attendance;
