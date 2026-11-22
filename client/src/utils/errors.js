import { ApiError } from '../api/client.js';

/**
 * Turns anything thrown by the API layer into `{ fields, message }`.
 * Field errors are shown next to their inputs; `message` is for a banner and is only
 * set when there is no field to attach the error to.
 */
export function toFormErrors(err) {
  if (err instanceof ApiError) {
    const hasFields = Object.keys(err.fields).length > 0;
    return { fields: err.fields, message: hasFields ? '' : err.message };
  }
  return { fields: {}, message: 'Something went wrong. Please try again.' };
}
