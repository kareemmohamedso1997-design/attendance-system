/**
 * Authentication Controller
 * Handles user login, registration, and token management
 */

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');
const { validateEmail, validatePassword, validateUsername } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * User Login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    // Get user from database
    const [users] = await db.query(
      `SELECT u.id, u.employee_id, u.password_hash, u.role_id, u.is_active, 
              u.locked_until, u.failed_login_attempts, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = ? OR u.email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      logger.warn(`Login attempt with non-existent user: ${username}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }

    const user = users[0];

    // Check if user is locked due to failed attempts
    if (user.locked_until) {
      const now = new Date();
      const lockedUntil = new Date(user.locked_until);

      if (now < lockedUntil) {
        logger.warn(`Locked user ${username} attempted login`);
        return res.status(401).json({
          status: 'error',
          message: `Account locked. Try again after ${lockedUntil.toLocaleTimeString()}`
        });
      } else {
        // Unlock user
        await db.query('UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?', [user.id]);
      }
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn(`Inactive user ${username} attempted login`);
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      // Increment failed login attempts
      const newFailedAttempts = user.failed_login_attempts + 1;
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

      if (newFailedAttempts >= maxAttempts) {
        const lockTime = parseInt(process.env.LOCK_TIME) || 15;
        const lockedUntil = new Date(Date.now() + lockTime * 60 * 1000);

        await db.query(
          'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
          [newFailedAttempts, lockedUntil, user.id]
        );

        logger.warn(`User ${username} locked after ${newFailedAttempts} failed attempts`);
        return res.status(401).json({
          status: 'error',
          message: `Too many failed attempts. Account locked for ${lockTime} minutes`
        });
      } else {
        await db.query('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [newFailedAttempts, user.id]);
      }

      logger.warn(`Failed login attempt for user ${username}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }

    // Reset failed attempts and update last login
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.employee_id, user.role, username);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`User ${username} logged in successfully`);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          employee_id: user.employee_id,
          username,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    next(error);
  }
};

/**
 * User Registration
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, employee_id } = req.body;

    // Validate input
    if (!username || !email || !password || !employee_id) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({
        status: 'error',
        message: 'Username must be 3-20 characters (alphanumeric, dots, hyphens only)'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
      });
    }

    // Check if employee exists
    const [employees] = await db.query('SELECT id FROM employees WHERE id = ?', [employee_id]);

    if (employees.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid employee ID'
      });
    }

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Username or email already in use'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user (role_id 2 is employee by default)
    await db.query(
      'INSERT INTO users (employee_id, username, email, password_hash, role_id) VALUES (?, ?, ?, ?, 2)',
      [employee_id, username, email, passwordHash]
    );

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. You can now log in.'
    });
  } catch (error) {
    logger.error('Registration error:', error.message);
    next(error);
  }
};

/**
 * Refresh Access Token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const { verifyToken } = require('../utils/tokenUtils');
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    // Get user info
    const [users] = await db.query(
      'SELECT u.id, u.employee_id, u.username, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = users[0];
    const newAccessToken = generateAccessToken(user.id, user.employee_id, user.role, user.username);

    res.json({
      status: 'success',
      message: 'Token refreshed',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error.message);
    next(error);
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // In a more advanced system, you might invalidate tokens here
    // For now, we just acknowledge the logout on the client side

    logger.info(`User ${req.user?.username} logged out`);

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error.message);
    next(error);
  }
};

/**
 * Get Current User Info
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.employee_id, u.username, u.email, r.name as role, e.name as employee_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN employees e ON u.employee_id = e.id
       WHERE u.id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = users[0];

    res.json({
      status: 'success',
      data: {
        id: user.id,
        employee_id: user.employee_id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee_name: user.employee_name
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error.message);
    next(error);
  }
};

/**
 * Add New Employee
 * POST /api/auth/employees
 * Only admins can add employees
 */
const addEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, department, position, hire_date, allowed_latitude, allowed_longitude, allowed_location_radius } = req.body;

    // Validate required fields
    if (!name || !email || !department || !position) {
      return res.status(400).json({
        status: 'error',
        message: 'name, email, department, and position are required'
      });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    // Check if email already exists
    const [existingEmployees] = await db.query('SELECT id FROM employees WHERE email = ?', [email]);

    if (existingEmployees.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
      });
    }

    // Set default location (Dubai coordinates) if not provided
    const latitude = allowed_latitude || 25.2048;
    const longitude = allowed_longitude || 55.2708;
    const radius = allowed_location_radius || 500;

    // Insert employee into database
    const [result] = await db.query(
      `INSERT INTO employees (name, email, phone, department, position, hire_date, allowed_latitude, allowed_longitude, allowed_location_radius)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, department, position, hire_date || null, latitude, longitude, radius]
    );

    logger.info(`New employee added: ${name} (${email}) - ID: ${result.insertId}`);

    res.status(201).json({
      status: 'success',
      message: 'Employee added successfully',
      data: {
        id: result.insertId,
        name,
        email,
        department,
        position
      }
    });
  } catch (error) {
    logger.error('Add employee error:', error.message);
    next(error);
  }
};

/**
 * Get All Employees
 * GET /api/auth/employees
 * Only admins can view all employees
 */
const getAllEmployees = async (req, res, next) => {
  try {
    const [employees] = await db.query(
      `SELECT id, name, email, phone, department, position, hire_date, status, created_at 
       FROM employees 
       ORDER BY name ASC`
    );

    res.json({
      status: 'success',
      data: employees
    });
  } catch (error) {
    logger.error('Get employees error:', error.message);
    next(error);
  }
};

/**
 * Delete Employee
 * DELETE /api/auth/employees/:id
 * Only admins can delete employees
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [employees] = await db.query('SELECT name FROM employees WHERE id = ?', [id]);

    if (employees.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }

    const employeeName = employees[0].name;

    // Check if employee has associated user
    const [users] = await db.query('SELECT id FROM users WHERE employee_id = ?', [id]);

    if (users.length > 0) {
      // Delete user first (cascade will handle it)
      await db.query('DELETE FROM users WHERE employee_id = ?', [id]);
    }

    // Delete employee (cascade will handle attendance records)
    await db.query('DELETE FROM employees WHERE id = ?', [id]);

    logger.info(`Employee deleted: ${employeeName} - ID: ${id}`);

    res.json({
      status: 'success',
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    logger.error('Delete employee error:', error.message);
    next(error);
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  getCurrentUser,
  addEmployee,
  getAllEmployees,
  deleteEmployee
};
