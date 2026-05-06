const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const AuthController = {
  /**
   * POST /auth/login
   * Authenticate a user with email + password.
   * Returns user data (no password) on success.
   */
  loginUser: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new AppError('email and password are required', 400));
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Fetch the stored password along with identity fields.
      // We select password here only so we can compare it — it is never
      // forwarded to the response.
      const [user] = await query(
        'SELECT id, name, email, password FROM users WHERE email = ?',
        [normalizedEmail]
      );

      // Use the same message for "not found" and "wrong password" to prevent
      // email enumeration: an attacker must not know which case was hit.
      if (!user || user.password !== password) {
        return next(new AppError('Invalid credentials', 401));
      }

      logger.info('User logged in', `id=${user.id} email=${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      logger.error('loginUser failed', error.message);
      next(error);
    }
  }
};

module.exports = AuthController;
