import { AppError } from '../utils/AppError.js';

/**
 * Allows access only to users with the specified role.
 * Must be used after requireAuth.
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return next(
        new AppError(
          403,
          'FORBIDDEN',
          'You do not have permission to access this resource.',
        ),
      );
    }

    return next();
  };
}