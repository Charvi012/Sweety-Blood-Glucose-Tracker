import * as readings from '../readings/repository.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
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
      return previousMonthRange(date);
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

/**
 * Summary is `{ count, highest, lowest, average }`.
 * With no readings, count is 0 and the rest are null.
 */
export async function buildReport(userId, type, date) {
  const range = resolveRange(type, date);
  const summary = await readings.stats(userId, range.from, range.to);
  const report = { type, date, range, summary };

  if (type === 'daily') {
    report.readings = await readings.list(userId, range);
  }

  return report;
}

/**
 * Builds a report only when the doctor is assigned to the patient.
 * Only patient accounts can be viewed through this function.
 */
export async function buildDoctorPatientReport(doctorId, patientId, type, date) {
  const { rows } = await pool.query(
    `SELECT 1
     FROM doctor_patients dp
     JOIN users patient ON patient.id = dp.patient_id
     WHERE dp.doctor_id = $1
       AND dp.patient_id = $2
       AND patient.role = 'patient'`,
    [doctorId, patientId],
  );

  if (!rows[0]) {
    throw new AppError(
      403,
      'PATIENT_NOT_ASSIGNED',
      'You are not authorized to view this patient.',
    );
  }

  return buildReport(patientId, type, date);
}