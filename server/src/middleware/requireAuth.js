import { verifyToken } from '../modules/auth/token.js';
import { AUTH_COOKIE } from '../modules/auth/cookie.js';
import { pool } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

/** Verifies the session and loads the authenticated user's role. */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    const payload = token && verifyToken(token);

    if (!payload) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue.'));
    }

    const { rows } = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [payload.sub],
    );

    if (!rows[0]) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue.'));
    }

    req.user = {
      id: rows[0].id,
      role: rows[0].role,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}
