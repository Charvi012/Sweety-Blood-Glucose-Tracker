import { MAX_VALUE, MIN_VALUE, SLOT_VALUES } from './constants.js';
import { isValidIsoDate } from './dates.js';

/**
 * Client-side checks that mirror the server's rules for instant feedback.
 * The server remains the source of truth and re-validates everything.
 */
export function validateReading({ date, slot, value }, today) {
  const errors = {};

  if (!date) errors.date = 'Please choose a date.';
  else if (!isValidIsoDate(date)) errors.date = 'Please enter a valid date.';
  else if (date > today) errors.date = 'Date cannot be in the future.';

  if (!SLOT_VALUES.includes(slot)) errors.slot = 'Please choose a time slot.';

  const raw = String(value ?? '').trim();
  if (raw === '') errors.value = 'Please enter a glucose value.';
  else if (!/^\d+$/.test(raw) || Number(raw) < MIN_VALUE || Number(raw) > MAX_VALUE) {
    errors.value = `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
  }

  return errors;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Please enter your email.';
  else if (!EMAIL.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Please enter your password.';
  return errors;
}

export function validateRegister({ name, email, password }) {
  const errors = validateLogin({ email, password });
  if (!name.trim()) errors.name = 'Please enter your name.';
  if (password) {
    if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must include at least one letter and one number.';
    }
  }
  return errors;
}
