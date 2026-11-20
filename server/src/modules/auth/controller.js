import * as authService from './service.js';
import { signToken } from './token.js';
import { setAuthCookie, clearAuthCookie } from './cookie.js';
import { AppError } from '../../utils/AppError.js';

export async function register(req, res) {
  const user = await authService.register(req.validated.body);
  setAuthCookie(res, signToken(user.id));
  res.status(201).json({ user });
}

export async function login(req, res) {
  const user = await authService.login(req.validated.body);
  setAuthCookie(res, signToken(user.id));
  res.json({ user });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

export async function me(req, res) {
  const user = await authService.getUserById(req.user.id);
  if (!user) {
    clearAuthCookie(res);
    throw new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
  }
  res.json({ user });
}
