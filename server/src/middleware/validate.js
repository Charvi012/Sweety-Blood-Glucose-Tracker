import { AppError } from '../utils/AppError.js';

function toValidationError(zodError) {
  const fields = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || '_';
    if (!(key in fields)) fields[key] = issue.message; // keep the first message per field
  }
  return new AppError(400, 'VALIDATION_ERROR', Object.values(fields)[0], fields);
}

/** Validates req[source] against a zod schema and stores the parsed result on req.validated. */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(toValidationError(result.error));
    req.validated = { ...req.validated, [source]: result.data };
    return next();
  };
}
