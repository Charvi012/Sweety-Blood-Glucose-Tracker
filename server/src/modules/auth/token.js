import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';

const ALGORITHM = 'HS256';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: `${config.JWT_EXPIRES_IN_HOURS}h`,
  });
}

/** Returns the payload, or null if the token is missing, expired or tampered with. */
export function verifyToken(token) {
  try {
    // Pin the algorithm so a forged "alg: none" token is never accepted.
    return jwt.verify(token, config.JWT_SECRET, { algorithms: [ALGORITHM] });
  } catch {
    return null;
  }
}
