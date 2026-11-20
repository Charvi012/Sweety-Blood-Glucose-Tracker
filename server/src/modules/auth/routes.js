import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { registerSchema, loginSchema } from './schemas.js';
import * as controller from './controller.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), asyncHandler(controller.register));
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(controller.login));
authRouter.post('/logout', controller.logout);
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
