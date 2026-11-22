import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { connectDoctorSchema } from './schemas.js';
import { connectDoctor, getAssignedPatients } from './service.js';

export const patientsRouter = Router();

patientsRouter.use(requireAuth);

// Patient connects to a registered doctor.
patientsRouter.post(
  '/doctor',
  requireRole('patient'),
  validate(connectDoctorSchema),
  asyncHandler(async (req, res) => {
    const result = await connectDoctor(req.user.id, req.validated.body.email);

    res.status(result.alreadyConnected ? 200 : 201).json(result);
  }),
);

// Doctor views their assigned patients.
patientsRouter.get(
  '/assigned',
  requireRole('doctor'),
  asyncHandler(async (req, res) => {
    const patients = await getAssignedPatients(req.user.id);

    res.json({ patients });
  }),
);