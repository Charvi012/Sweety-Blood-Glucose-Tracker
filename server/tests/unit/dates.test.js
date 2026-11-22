import { describe, it, expect } from 'vitest';
import { firstDayOfMonth, isValidIsoDate, previousMonthRange, todayInTimeZone } from '../../src/utils/dates.js';

describe('isValidIsoDate', () => {
  it('accepts real calendar dates, including leap days', () => {
    expect(isValidIsoDate('2025-10-15')).toBe(true);
    expect(isValidIsoDate('2024-02-29')).toBe(true);
  });

  it.each(['2025-02-29', '2025-02-30', '2025-13-01', '2025-00-10', '2025-1-1', '15-10-2025', '', 'abc'])(
    'rejects %s',
    (value) => expect(isValidIsoDate(value)).toBe(false),
  );

  it('rejects non-strings', () => {
    expect(isValidIsoDate(20251015)).toBe(false);
    expect(isValidIsoDate(null)).toBe(false);
  });
});

describe('todayInTimeZone', () => {
  const now = new Date('2025-01-01T20:00:00Z');

  it('uses the calendar date in the requested time zone', () => {
    expect(todayInTimeZone('Asia/Kolkata', now)).toBe('2025-01-02'); // already past midnight in India
    expect(todayInTimeZone('America/Los_Angeles', now)).toBe('2025-01-01');
  });
});

describe('firstDayOfMonth', () => {
  it('returns the 1st of the same month', () => {
    expect(firstDayOfMonth('2025-10-15')).toBe('2025-10-01');
  });
});

describe('previousMonthRange', () => {
  it('returns the whole previous month', () => {
    expect(previousMonthRange('2025-10-15')).toEqual({ from: '2025-09-01', to: '2025-09-30' });
  });
  it('rolls back over the year boundary', () => {
    expect(previousMonthRange('2025-01-10')).toEqual({ from: '2024-12-01', to: '2024-12-31' });
  });
  it('handles February in leap and non-leap years', () => {
    expect(previousMonthRange('2024-03-15')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    expect(previousMonthRange('2025-03-01')).toEqual({ from: '2025-02-01', to: '2025-02-28' });
  });
});
