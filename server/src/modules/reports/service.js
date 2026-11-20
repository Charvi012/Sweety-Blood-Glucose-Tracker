import * as readings from '../readings/repository.js';
import { firstDayOfMonth, previousMonthRange } from '../../utils/dates.js';

export const REPORT_TYPES = ['daily', 'month-to-date', 'monthly'];

/** Date range covered by each report, relative to the selected date. */
export function resolveRange(type, date) {
  switch (type) {
    case 'daily':
      return { from: date, to: date };
    case 'month-to-date':
      return { from: firstDayOfMonth(date), to: date };
    case 'monthly':
      return previousMonthRange(date); // the whole previous month
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

/**
 * Summary is `{ count, highest, lowest, average }`. With no readings, count is 0 and the
 * rest are null, which the UI turns into a friendly empty state.
 */
export async function buildReport(userId, type, date) {
  const range = resolveRange(type, date);
  const summary = await readings.stats(userId, range.from, range.to);
  const report = { type, date, range, summary };
  if (type === 'daily') {
    // For a single day the repository already returns readings in slot order.
    report.readings = await readings.list(userId, range);
  }
  return report;
}
