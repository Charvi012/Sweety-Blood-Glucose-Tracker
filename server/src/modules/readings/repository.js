import { pool } from '../../db/pool.js';
import { SLOTS, SLOT_LABELS } from './slots.js';

/** SQL-side ordering so lists always read morning -> night. */
const SLOT_ORDER = `CASE slot ${SLOTS.map((s, i) => `WHEN '${s}' THEN ${i}`).join(' ')} END`;

const COLUMNS = `id, reading_date AS date, slot, value,
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export const toReading = (row) => ({ ...row, slotLabel: SLOT_LABELS[row.slot] });

export async function insert(userId, { date, slot, value }) {
  const { rows } = await pool.query(
    `INSERT INTO readings (user_id, reading_date, slot, value)
     VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
    [userId, date, slot, value],
  );
  return toReading(rows[0]);
}

export async function findById(userId, id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM readings WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] ? toReading(rows[0]) : null;
}

export async function list(userId, { from, to }) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM readings
     WHERE user_id = $1
       AND ($2::date IS NULL OR reading_date >= $2::date)
       AND ($3::date IS NULL OR reading_date <= $3::date)
     ORDER BY reading_date DESC, ${SLOT_ORDER}
     LIMIT 1000`,
    [userId, from ?? null, to ?? null],
  );
  return rows.map(toReading);
}

/** Number of readings on a date, optionally ignoring one reading (used when editing). */
export async function countForDate(userId, date, excludeId = null) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::uuid IS NULL OR id <> $3::uuid)`,
    [userId, date, excludeId],
  );
  return rows[0].count;
}

export async function update(userId, id, { date, slot, value }) {
  const { rows } = await pool.query(
    `UPDATE readings
        SET reading_date = $3, slot = $4, value = $5, updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING ${COLUMNS}`,
    [id, userId, date, slot, value],
  );
  return rows[0] ? toReading(rows[0]) : null;
}

export async function remove(userId, id) {
  const { rowCount } = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, userId]);
  return rowCount > 0;
}

/** Highest / lowest / average (1 decimal) / count over an inclusive date range. */
export async function stats(userId, from, to) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int                       AS count,
            MAX(value)                          AS highest,
            MIN(value)                          AS lowest,
            ROUND(AVG(value)::numeric, 1)::float8 AS average
       FROM readings
      WHERE user_id = $1 AND reading_date BETWEEN $2::date AND $3::date`,
    [userId, from, to],
  );
  return rows[0];
}
