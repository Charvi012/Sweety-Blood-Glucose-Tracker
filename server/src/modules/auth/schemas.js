import { z } from 'zod';

const name = z
  .string({ required_error: 'Please enter your name.', invalid_type_error: 'Please enter your name.' })
  .trim()
  .min(1, 'Please enter your name.')
  .max(100, 'Name must be 100 characters or fewer.');

export const email = z
  .string({ required_error: 'Please enter your email.', invalid_type_error: 'Please enter your email.' })
  .trim()
  .toLowerCase()
  .min(1, 'Please enter your email.')
  .max(254, 'Email is too long.')
  .email('Please enter a valid email address.');

// bcrypt only uses the first 72 bytes of a password.
const newPassword = z
  .string({ required_error: 'Please enter a password.', invalid_type_error: 'Please enter a password.' })
  .min(8, 'Password must be at least 8 characters.')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 bytes.')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password must include at least one letter and one number.');

export const ROLES = ['patient', 'doctor'];

const role = z
  .enum(ROLES, { errorMap: () => ({ message: 'Please choose patient or doctor.' }) })
  .default('patient');

export const registerSchema = z.object({
  name,
  email,
  password: newPassword,
  role,
});

export const loginSchema = z.object({
  email,
  password: z
    .string({ required_error: 'Please enter your password.', invalid_type_error: 'Please enter your password.' })
    .min(1, 'Please enter your password.')
    .max(200, 'Password is too long.'),
});