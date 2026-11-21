import { describe, expect, it } from 'vitest';
import { validateLogin, validateReading, validateRegister } from '../src/utils/validation.js';
import { formatDate, formatRange, todayLocal } from '../src/utils/dates.js';

const TODAY = '2025-10-15';
const ok = { date: '2025-10-15', slot: 'after_lunch', value: '120' };

describe('validateReading', () => {
  it('accepts a valid reading and the boundary values', () => {
    expect(validateReading(ok, TODAY)).toEqual({});
    expect(validateReading({ ...ok, value: '40' }, TODAY)).toEqual({});
    expect(validateReading({ ...ok, value: '600' }, TODAY)).toEqual({});
  });

  it('requires a value', () => {
    expect(validateReading({ ...ok, value: '' }, TODAY).value).toBe('Please enter a glucose value.');
    expect(validateReading({ ...ok, value: '   ' }, TODAY).value).toBe('Please enter a glucose value.');
  });

  it.each(['39', '601', '120.5', '-5', '1e2', 'abc'])('rejects value %s', (value) => {
    expect(validateReading({ ...ok, value }, TODAY).value).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('rejects a future date', () => {
    expect(validateReading({ ...ok, date: '2025-10-16' }, TODAY).date).toBe('Date cannot be in the future.');
  });

  it('requires a date and a slot', () => {
    const errors = validateReading({ date: '', slot: '', value: '100' }, TODAY);
    expect(errors.date).toBe('Please choose a date.');
    expect(errors.slot).toBe('Please choose a time slot.');
  });
});

describe('auth validation', () => {
  it('login requires email and password', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Please enter your email.',
      password: 'Please enter your password.',
    });
  });

  it('register enforces the password rules', () => {
    const base = { name: 'Asha', email: 'a@b.co' };
    expect(validateRegister({ ...base, password: 'short1' }).password).toMatch(/at least 8/);
    expect(validateRegister({ ...base, password: 'onlyletters' }).password).toMatch(/letter and one number/);
    expect(validateRegister({ ...base, password: 'Passw0rd!x' })).toEqual({});
  });
});

describe('date formatting', () => {
  it('formats single dates and ranges like the assignment examples', () => {
    expect(formatDate('2026-10-15')).toBe('15 Oct 2026');
    expect(formatRange('2026-10-01', '2026-10-15')).toBe('1 Oct – 15 Oct 2026');
    expect(formatRange('2026-09-01', '2026-09-30')).toBe('1 Sep – 30 Sep 2026');
    expect(formatRange('2026-10-15', '2026-10-15')).toBe('15 Oct 2026');
  });

  it('todayLocal uses local calendar parts', () => {
    expect(todayLocal(new Date(2025, 0, 5, 23, 30))).toBe('2025-01-05');
  });
});
