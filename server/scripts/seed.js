import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool.js';
import { config } from '../src/config/index.js';
import { todayInTimeZone } from '../src/utils/dates.js';

const DEMO_PASSWORD = 'SweetyDemo2026!';

const DEMO_PATIENT = {
  name: 'Demo Patient',
  email: 'demo.patient@example.com',
  role: 'patient',
};

const DEMO_DOCTOR = {
  name: 'Demo Doctor',
  email: 'demo.doctor@example.com',
  role: 'doctor',
};

function subtractDays(date, days) {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() - days);
  return result.toISOString().slice(0, 10);
}

async function createOrUpdateDemoUser(client, user) {
  const existing = await client.query(
    'SELECT id, name, role FROM users WHERE lower(email) = lower($1)',
    [user.email],
  );

  if (existing.rows.length > 0) {
    const account = existing.rows[0];

    if (account.name !== user.name || account.role !== user.role) {
      throw new Error(
        `The email ${user.email} already belongs to a different account.`,
      );
    }

    const passwordHash = await bcrypt.hash(
      DEMO_PASSWORD,
      config.BCRYPT_COST,
    );

    await client.query(
      'UPDATE users SET password_hash = $2 WHERE id = $1',
      [account.id, passwordHash],
    );

    return account.id;
  }

  const passwordHash = await bcrypt.hash(
    DEMO_PASSWORD,
    config.BCRYPT_COST,
  );

  const { rows } = await client.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [user.name, user.email, passwordHash, user.role],
  );

  return rows[0].id;
}

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const patientId = await createOrUpdateDemoUser(
      client,
      DEMO_PATIENT,
    );

    const doctorId = await createOrUpdateDemoUser(
      client,
      DEMO_DOCTOR,
    );

    const today = todayInTimeZone(config.APP_TIMEZONE);
    const yesterday = subtractDays(today, 1);

    // Replace only the sample readings belonging to the demo patient.
    await client.query(
      'DELETE FROM readings WHERE user_id = $1',
      [patientId],
    );

    const sampleReadings = [
      { date: yesterday, slot: 'morning_fasting', value: 92 },
      { date: yesterday, slot: 'after_breakfast', value: 145 },
      { date: yesterday, slot: 'after_lunch', value: 132 },
      { date: yesterday, slot: 'after_dinner', value: 121 },

      { date: today, slot: 'morning_fasting', value: 96 },
      { date: today, slot: 'after_breakfast', value: 138 },
      { date: today, slot: 'after_lunch', value: 126 },
      { date: today, slot: 'after_dinner', value: 118 },
    ];

    for (const reading of sampleReadings) {
      await client.query(
        `INSERT INTO readings
           (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)`,
        [
          patientId,
          reading.date,
          reading.slot,
          reading.value,
        ],
      );
    }

    await client.query(
      `INSERT INTO doctor_patients (doctor_id, patient_id)
       VALUES ($1, $2)
       ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
      [doctorId, patientId],
    );

    await client.query('COMMIT');

    console.log('\nDemo data created successfully!');
    console.log('--------------------------------');
    console.log('Patient: demo.patient@example.com');
    console.log('Doctor:  demo.doctor@example.com');
    console.log(`Password: ${DEMO_PASSWORD}`);
    console.log('Sample readings: 8');
    console.log('Doctor-patient connection: created');
    console.log('\nThese are demo-only credentials.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

try {
  await seed();
} catch (error) {
  console.error('Demo seeding failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}