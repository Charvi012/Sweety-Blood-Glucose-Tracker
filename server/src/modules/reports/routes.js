import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { reportQuerySchema } from './schemas.js';
import { buildReport } from './service.js';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get(
  '/',
  validate(reportQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { type, date } = req.validated.query;
    res.json({ report: await buildReport(req.user.id, type, date) });
  }),
);
