const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

export function isValidIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (y < 1900) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Today in the browser's local time zone, as YYYY-MM-DD. */
export function todayLocal(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Built by hand (not Intl) so month names are identical on every browser: "Sep", never "Sept".
const parts = (iso) => ({ y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });

/** '2026-10-15' -> '15 Oct 2026' */
export function formatDate(iso) {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** ('2026-10-01', '2026-10-15') -> '1 Oct – 15 Oct 2026'; a single day -> '15 Oct 2026' */
export function formatRange(from, to) {
  if (from === to) return formatDate(from);
  const a = parts(from);
  const start = a.y === parts(to).y ? `${a.d} ${MONTHS[a.m - 1]}` : formatDate(from);
  return `${start} – ${formatDate(to)}`;
}
