import { z } from 'zod';
import { pastOrTodayDate } from '../readings/schemas.js';
import { REPORT_TYPES } from './service.js';

export const reportQuerySchema = z.object({
  type: z.enum(REPORT_TYPES, {
    errorMap: () => ({ message: `type must be one of: ${REPORT_TYPES.join(', ')}.` }),
  }),
  date: pastOrTodayDate(),
});
