import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { reportQuerySchema } from './schemas.js';
import { buildReport, buildDoctorPatientReport } from './service.js';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

// Patient can view their own reports.
reportsRouter.get(
  '/',
  validate(reportQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { type, date } = req.validated.query;
    res.json({ report: await buildReport(req.user.id, type, date) });
  }),
);

// Doctor can view reports only for patients assigned to them.
reportsRouter.get(
  '/patients/:patientId',
  requireRole('doctor'),
  validate(reportQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { type, date } = req.validated.query;
    const report = await buildDoctorPatientReport(
      req.user.id,
      req.params.patientId,
      type,
      date,
    );

    res.json({ report });
  }),
);