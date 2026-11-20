import { config } from '../../config/index.js';

export const AUTH_COOKIE = 'sweety_token';

const baseOptions = {
  httpOnly: true, // not readable by JavaScript, so XSS cannot steal the token
  sameSite: 'strict', // not sent on cross-site requests, which blocks CSRF
  secure: config.NODE_ENV === 'production',
  path: '/',
};

export const setAuthCookie = (res, token) =>
  res.cookie(AUTH_COOKIE, token, { ...baseOptions, maxAge: config.JWT_EXPIRES_IN_HOURS * 60 * 60 * 1000 });

export const clearAuthCookie = (res) => res.clearCookie(AUTH_COOKIE, baseOptions);
