const db       = require('../config/database');
const AppError = require('../utils/AppError');
const logger   = require('../utils/logger');

/**
 * GET /api/users
 * All active + inactive employees. Admin only.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const [employees] = await db.query(
      `SELECT id, name, email, department, position, hire_date, status, created_at
       FROM employees
       ORDER BY name ASC`
    );

    return res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/users/:id
 * Single employee by PK. Admin only.
 */
const getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id < 1) {
      return next(new AppError('User ID must be a positive integer', 400));
    }

    const [[employee]] = await db.query(
      `SELECT id, name, email, department, position, hire_date, status, created_at
       FROM employees
       WHERE id = ?`,
      [id]
    );

    if (!employee) {
      return next(new AppError(`User ${id} not found`, 404));
    }

    return res.json({ success: true, data: employee });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAllUsers, getUserById };
