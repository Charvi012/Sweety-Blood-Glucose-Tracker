import { z } from 'zod';
import { email } from '../auth/schemas.js';

export const connectDoctorSchema = z.object({
  email,
});