import { z } from 'zod';
import { config } from '../../config/index.js';
import { isValidIsoDate, todayInTimeZone } from '../../utils/dates.js';
import { SLOTS, MIN_VALUE, MAX_VALUE } from './slots.js';

export const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueRange: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
  dateRequired: 'Please choose a date.',
  dateInvalid: 'Please enter a valid date.',
  dateFuture: 'Date cannot be in the future.',
  slotInvalid: 'Please choose a time slot.',
};

const defaultToday = () => todayInTimeZone(config.APP_TIMEZONE);

/** A YYYY-MM-DD string that is a real calendar date and is not in the future. */
export const pastOrTodayDate = (getToday = defaultToday) =>
  z
    .string({ required_error: MESSAGES.dateRequired, invalid_type_error: MESSAGES.dateInvalid })
    .superRefine((value, ctx) => {
      if (!isValidIsoDate(value)) {
        ctx.addIssue({ code: 'custom', message: MESSAGES.dateInvalid });
      } else if (value > getToday()) {
        // ISO dates compare correctly as plain strings.
        ctx.addIssue({ code: 'custom', message: MESSAGES.dateFuture });
      }
    });

/**
 * Body for creating or replacing a reading.
 * `getToday` is injectable so tests can control the clock.
 */
export const buildReadingSchema = (getToday = defaultToday) =>
  z.object({
    date: pastOrTodayDate(getToday),
    slot: z.enum(SLOTS, { errorMap: () => ({ message: MESSAGES.slotInvalid }) }),
    value: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z
        .number({ required_error: MESSAGES.valueRequired, invalid_type_error: MESSAGES.valueRange })
        .int(MESSAGES.valueRange)
        .min(MIN_VALUE, MESSAGES.valueRange)
        .max(MAX_VALUE, MESSAGES.valueRange),
    ),
  });

export const readingSchema = buildReadingSchema();

const uuid = z.string().uuid();
export const idParamSchema = z.object({ id: uuid });

const optionalDate = z
  .string()
  .refine(isValidIsoDate, MESSAGES.dateInvalid)
  .optional();

export const listQuerySchema = z
  .object({ from: optionalDate, to: optionalDate })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must not be after "to".',
    path: ['from'],
  });
