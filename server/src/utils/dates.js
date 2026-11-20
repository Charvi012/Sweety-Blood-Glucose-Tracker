/**
 * Date helpers. Dates are handled as plain 'YYYY-MM-DD' strings everywhere so that
 * time zones can never shift a reading onto the wrong day.
 */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_YEAR = 1900;

const pad = (n) => String(n).padStart(2, '0');

export function isValidIsoDate(value) {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < MIN_YEAR) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  // Rejects things like 2025-02-30, which JS would silently roll over to March.
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/** Today's calendar date ('YYYY-MM-DD') in the given IANA time zone. */
export function todayInTimeZone(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** '2025-10-15' -> '2025-10-01' */
export function firstDayOfMonth(isoDate) {
  return `${isoDate.slice(0, 7)}-01`;
}

/** The whole calendar month before the month of `isoDate`. */
export function previousMonthRange(isoDate) {
  let year = Number(isoDate.slice(0, 4));
  let month = Number(isoDate.slice(5, 7)) - 1; // previous month, 1-based
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  // Day 0 of the *next* month is the last day of `month`.
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay)}` };
}
