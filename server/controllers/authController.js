const db     = require('../config/database');
const bcrypt = require('bcryptjs');
const {
  generateAccessToken, generateRefreshToken,
  verifyToken, hashToken, getTokenExpiry,
} = require('../utils/tokenUtils');
const { validateEmail, validatePassword, validateUsername } = require('../utils/validators');
const logger = require('../utils/logger');

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username and password are required' });
    }

    const [users] = await db.query(
      `SELECT u.id, u.employee_id, u.password_hash, u.role_id, u.is_active,
              u.locked_until, u.failed_login_attempts, r.name as role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.username = ? OR u.email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      logger.warn(`Login: unknown user '${username}'`);
      return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }

    const user = users[0];

    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (new Date() < lockedUntil) {
        return res.status(401).json({
          status: 'error',
          message: `Account locked. Try again after ${lockedUntil.toLocaleTimeString()}`,
        });
      }
      await db.query('UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?', [user.id]);
    }

    if (!user.is_active) {
      return res.status(401).json({ status: 'error', message: 'Account is deactivated.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const attempts    = user.failed_login_attempts + 1;
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

      if (attempts >= maxAttempts) {
        const lockMins    = parseInt(process.env.LOCK_TIME) || 15;
        const lockedUntil = new Date(Date.now() + lockMins * 60_000);
        await db.query('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
          [attempts, lockedUntil, user.id]);
        return res.status(401).json({
          status: 'error',
          message: `Too many failed attempts. Account locked for ${lockMins} minutes.`,
        });
      }

      await db.query('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [attempts, user.id]);
      return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }

    await db.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // ── Generate token pair ───────────────────────────────────────────────────
    const accessToken  = generateAccessToken(user.id, user.employee_id, user.role, username);
    const refreshToken = generateRefreshToken(user.id);

    // ── Persist refresh token hash ────────────────────────────────────────────
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [user.id, hashToken(refreshToken), getTokenExpiry(refreshToken)]
    );

    logger.info(`Login: user '${username}' authenticated`);

    return res.json({
      status:  'success',
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id:          user.id,
          employee_id: user.employee_id,
          username,
          role:        user.role,
        },
      },
    });
  } catch (err) {
    logger.error('Login error:', err.message);
    next(err);
  }
};

// ── Refresh Token Rotation ────────────────────────────────────────────────────
// 1. Verify JWT signature and type.
// 2. Look up token hash in DB — reject if not found or revoked.
// 3. Detect reuse: revoked token arriving → possible theft → nuke all user tokens.
// 4. Rotate: mark old record revoked, insert new record, return new pair.
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Refresh token required.' });
    }

    // Step 1 — JWT verification
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ status: 'error', message: 'Invalid refresh token.' });
    }

    // Step 2 — DB lookup
    const tokenHash = hashToken(token);
    const [[record]] = await db.query(
      `SELECT id, user_id, expires_at, revoked
       FROM refresh_tokens
       WHERE token_hash = ?`,
      [tokenHash]
    );

    if (!record) {
      return res.status(401).json({ status: 'error', message: 'Refresh token not recognised.' });
    }

    // Step 3 — Reuse detection (token replay attack)
    if (record.revoked) {
      logger.warn(`Refresh token reuse detected — revoking all tokens for user ${record.user_id}`);
      await db.query('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [record.user_id]);
      return res.status(401).json({
        status: 'error',
        message: 'Token reuse detected. Please log in again.',
      });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(401).json({ status: 'error', message: 'Refresh token expired.' });
    }

    // Look up user
    const [users] = await db.query(
      `SELECT u.id, u.employee_id, u.username, r.name as role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = 1`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ status: 'error', message: 'User not found or inactive.' });
    }

    const user = users[0];

    // Step 4 — Rotate
    const newAccessToken  = generateAccessToken(user.id, user.employee_id, user.role, user.username);
    const newRefreshToken = generateRefreshToken(user.id);

    await db.query('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [record.id]);
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [user.id, hashToken(newRefreshToken), getTokenExpiry(newRefreshToken)]
    );

    logger.info(`Token rotated for user '${user.username}'`);

    return res.json({
      status: 'success',
      data: {
        accessToken:  newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    logger.error('Refresh error:', err.message);
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
// Revokes the provided refresh token in the DB.
// The access token is short-lived (15 m) and requires no server-side action.
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await db.query(
        'UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?',
        [hashToken(token)]
      );
    }

    logger.info(`Logout: user '${req.user?.username}'`);

    return res.json({ status: 'success', message: 'Logged out successfully.' });
  } catch (err) {
    logger.error('Logout error:', err.message);
    next(err);
  }
};

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, email, password, employee_id } = req.body;

    if (!username || !email || !password || !employee_id) {
      return res.status(400).json({ status: 'error', message: 'All fields are required.' });
    }
    if (!validateUsername(username))
      return res.status(400).json({ status: 'error', message: 'Username must be 3-20 chars (alphanumeric, dots, hyphens).' });
    if (!validateEmail(email))
      return res.status(400).json({ status: 'error', message: 'Invalid email format.' });
    if (!validatePassword(password))
      return res.status(400).json({ status: 'error', message: 'Password needs uppercase, lowercase, and numbers (8+ chars).' });

    const [employees] = await db.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (employees.length === 0)
      return res.status(400).json({ status: 'error', message: 'Invalid employee ID.' });

    const [existing] = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0)
      return res.status(400).json({ status: 'error', message: 'Username or email already in use.' });

    const saltRounds  = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await db.query(
      'INSERT INTO users (employee_id, username, email, password_hash, role_id) VALUES (?, ?, ?, ?, 2)',
      [employee_id, username, email, passwordHash]
    );

    logger.info(`Registration: new user '${username}'`);
    return res.status(201).json({ status: 'success', message: 'Registration successful.' });
  } catch (err) {
    logger.error('Register error:', err.message);
    next(err);
  }
};

// ── Get current user ──────────────────────────────────────────────────────────
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

    if (users.length === 0)
      return res.status(404).json({ status: 'error', message: 'User not found.' });

    const u = users[0];
    return res.json({
      status: 'success',
      data: {
        id: u.id, employee_id: u.employee_id, username: u.username,
        email: u.email, role: u.role, employee_name: u.employee_name,
      },
    });
  } catch (err) {
    logger.error('getCurrentUser error:', err.message);
    next(err);
  }
};

// ── Add employee (admin) ──────────────────────────────────────────────────────
const addEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, department, position, hire_date,
            allowed_latitude, allowed_longitude, allowed_location_radius } = req.body;

    if (!name || !email || !department || !position)
      return res.status(400).json({ status: 'error', message: 'name, email, department, and position are required.' });
    if (!validateEmail(email))
      return res.status(400).json({ status: 'error', message: 'Invalid email format.' });

    const [[existingEmp]]  = await db.query('SELECT id FROM employees WHERE email = ?', [email]);
    if (existingEmp) return res.status(409).json({ status: 'error', message: 'Employee with this email already exists.' });

    const [[existingUser]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) return res.status(409).json({ status: 'error', message: 'Login account with this email already exists.' });

    const [empResult] = await db.query(
      `INSERT INTO employees (name, email, phone, department, position, hire_date,
                              allowed_latitude, allowed_longitude, allowed_location_radius)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, department, position, hire_date || null,
       allowed_latitude || 25.2048, allowed_longitude || 55.2708, allowed_location_radius || 500]
    );
    const employeeId = empResult.insertId;

    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '').substring(0, 20) || `emp${employeeId}`;
    const [[takenUser]] = await db.query('SELECT id FROM users WHERE username = ?', [baseUsername]);
    const username = takenUser ? `${baseUsername.substring(0, 16)}_${employeeId}` : baseUsername;

    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || '123456';
    const passwordHash    = await bcrypt.hash(defaultPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    await db.query(
      `INSERT INTO users (employee_id, username, email, password_hash, role_id, is_active)
       VALUES (?, ?, ?, ?, 2, 1)`,
      [employeeId, username, email, passwordHash]
    );

    logger.info(`Employee created: ${name} <${email}> id=${employeeId}`);

    return res.status(201).json({
      status: 'success',
      message: 'Employee and login account created successfully.',
      data: {
        employee: { id: employeeId, name, email, phone: phone || null, department, position, hire_date: hire_date || null },
        login:    { username, password: defaultPassword },
      },
    });
  } catch (err) {
    logger.error('addEmployee error:', err.message);
    next(err);
  }
};

// ── Get all employees (admin) ─────────────────────────────────────────────────
const getAllEmployees = async (req, res, next) => {
  try {
    const [employees] = await db.query(
      `SELECT id, name, email, phone, department, position, hire_date, status, created_at
       FROM employees ORDER BY name ASC`
    );
    return res.json({ status: 'success', data: employees });
  } catch (err) {
    logger.error('getAllEmployees error:', err.message);
    next(err);
  }
};

// ── Delete employee (admin) ───────────────────────────────────────────────────
const deleteEmployee = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1)
      return res.status(400).json({ status: 'error', message: 'Employee ID must be a positive integer.' });

    const [[employee]] = await db.query('SELECT id, name FROM employees WHERE id = ?', [id]);
    if (!employee) return res.status(404).json({ status: 'error', message: 'Employee not found.' });

    await db.query('DELETE FROM users WHERE employee_id = ?', [id]);
    await db.query('DELETE FROM employees WHERE id = ?', [id]);

    logger.info(`Employee deleted: ${employee.name} (id=${id})`);
    return res.json({ status: 'success', message: `Employee "${employee.name}" deleted.` });
  } catch (err) {
    logger.error('deleteEmployee error:', err.message);
    next(err);
  }
};

module.exports = {
  login, register, refreshToken, logout,
  getCurrentUser, addEmployee, getAllEmployees, deleteEmployee,
};
