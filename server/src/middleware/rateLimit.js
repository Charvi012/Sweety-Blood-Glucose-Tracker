import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

const message = (text) => ({ error: { code: 'RATE_LIMITED', message: text } });
const skip = () => config.NODE_ENV === 'test';

/** Slows down password guessing on login/register. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: message('Too many attempts. Please try again in a few minutes.'),
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: message('Too many requests. Please slow down.'),
});
