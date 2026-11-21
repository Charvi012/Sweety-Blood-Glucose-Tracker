import { pool } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';

export async function connectDoctor(patientId, email) {
  // Find a registered doctor using their email.
  const { rows } = await pool.query(
    `SELECT id, name, email
     FROM users
     WHERE lower(email) = $1
       AND role = 'doctor'`,
    [email],
  );

  const doctor = rows[0];

  if (!doctor) {
    throw new AppError(
      404,
      'DOCTOR_NOT_FOUND',
      'No registered doctor was found with this email.',
    );
  }

  // Create the patient-doctor connection.
  const result = await pool.query(
    `INSERT INTO doctor_patients (doctor_id, patient_id)
     VALUES ($1, $2)
     ON CONFLICT (doctor_id, patient_id) DO NOTHING
     RETURNING doctor_id`,
    [doctor.id, patientId],
  );

  return {
    doctor: {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
    },
    alreadyConnected: result.rowCount === 0,
  };
}
export async function getAssignedPatients(doctorId) {
  const { rows } = await pool.query(
    `SELECT
       patient.id,
       patient.name,
       patient.email,
       dp.created_at AS connected_at
     FROM doctor_patients dp
     JOIN users patient ON patient.id = dp.patient_id
     WHERE dp.doctor_id = $1
       AND patient.role = 'patient'
     ORDER BY patient.name ASC`,
    [doctorId],
  );

  return rows.map((patient) => ({
    id: patient.id,
    name: patient.name,
    email: patient.email,
    connectedAt: patient.connected_at,
  }));
}