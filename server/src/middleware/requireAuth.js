import { verifyToken } from '../modules/auth/token.js';
import { AUTH_COOKIE } from '../modules/auth/cookie.js';
import { AppError } from '../utils/AppError.js';

/** Reads the JWT from the httpOnly cookie and sets req.user = { id }. */
export function requireAuth(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  const payload = token && verifyToken(token);
  if (!payload) return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue.'));
  req.user = { id: payload.sub };
  return next();
}
