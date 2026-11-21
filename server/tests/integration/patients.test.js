import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  app,
  closeDatabase,
  createLoggedInAgent,
  resetDatabase,
  setupDatabase,
} from '../helpers.js';

beforeAll(setupDatabase);
beforeEach(resetDatabase);
afterAll(closeDatabase);

describe('POST /api/patients/doctor', () => {
  it('allows a patient to connect to a registered doctor', async () => {
    const patient = await createLoggedInAgent();
    const doctor = await createLoggedInAgent({
      name: 'Dr. Asha',
      email: 'doctor@example.com',
      role: 'doctor',
    });

    const { body } = await patient.agent
      .post('/api/patients/doctor')
      .send({ email: doctor.credentials.email })
      .expect(201);

    expect(body.doctor).toEqual({
      id: doctor.user.id,
      name: 'Dr. Asha',
      email: 'doctor@example.com',
    });
    expect(body.alreadyConnected).toBe(false);
  });

  it('does not create duplicate connections', async () => {
    const patient = await createLoggedInAgent();
    const doctor = await createLoggedInAgent({
      role: 'doctor',
      email: 'doctor@example.com',
    });

    await patient.agent
      .post('/api/patients/doctor')
      .send({ email: doctor.credentials.email })
      .expect(201);

    const { body } = await patient.agent
      .post('/api/patients/doctor')
      .send({ email: doctor.credentials.email })
      .expect(200);

    expect(body.alreadyConnected).toBe(true);
  });

  it('rejects an email that does not belong to a doctor', async () => {
    const patient = await createLoggedInAgent();

    await patient.agent
      .post('/api/patients/doctor')
      .send({ email: 'unknown@example.com' })
      .expect(404);
  });

  it('does not allow patients to connect to another patient', async () => {
    const patient = await createLoggedInAgent();
    await createLoggedInAgent({ email: 'another@example.com' });

    await patient.agent
      .post('/api/patients/doctor')
      .send({ email: 'another@example.com' })
      .expect(404);
  });

  it('does not allow doctors to use the connection endpoint', async () => {
    const doctor = await createLoggedInAgent({ role: 'doctor' });

    await doctor.agent
      .post('/api/patients/doctor')
      .send({ email: 'someone@example.com' })
      .expect(403);
  });

  it('requires login', async () => {
    await request(app)
      .post('/api/patients/doctor')
      .send({ email: 'doctor@example.com' })
      .expect(401);
  });

  it('validates the email address', async () => {
    const patient = await createLoggedInAgent();

    await patient.agent
      .post('/api/patients/doctor')
      .send({ email: 'invalid-email' })
      .expect(400);
  });
});
describe('GET /api/patients/assigned', () => {
  it('returns patients assigned to the logged-in doctor', async () => {
    const doctor = await createLoggedInAgent({
      role: 'doctor',
      email: 'doctor@example.com',
    });
    const patient = await createLoggedInAgent({
      name: 'Patient A',
      email: 'patient@example.com',
    });

    await patient.agent
      .post('/api/patients/doctor')
      .send({ email: doctor.credentials.email })
      .expect(201);

    const { body } = await doctor.agent
      .get('/api/patients/assigned')
      .expect(200);

    expect(body.patients).toHaveLength(1);
    expect(body.patients[0]).toMatchObject({
      id: patient.user.id,
      name: 'Patient A',
      email: 'patient@example.com',
    });
    expect(body.patients[0].connectedAt).toBeTruthy();
  });

  it('does not return patients assigned to another doctor', async () => {
    const doctorA = await createLoggedInAgent({
      role: 'doctor',
      email: 'doctorA@example.com',
    });
    const doctorB = await createLoggedInAgent({
      role: 'doctor',
      email: 'doctorB@example.com',
    });
    const patient = await createLoggedInAgent();

    await patient.agent
      .post('/api/patients/doctor')
      .send({ email: doctorA.credentials.email })
      .expect(201);

    const { body } = await doctorB.agent
      .get('/api/patients/assigned')
      .expect(200);

    expect(body.patients).toEqual([]);
  });

  it('returns an empty list when the doctor has no assigned patients', async () => {
    const doctor = await createLoggedInAgent({ role: 'doctor' });

    const { body } = await doctor.agent
      .get('/api/patients/assigned')
      .expect(200);

    expect(body.patients).toEqual([]);
  });

  it('does not allow patients to access the assigned-patients endpoint', async () => {
    const patient = await createLoggedInAgent();

    await patient.agent
      .get('/api/patients/assigned')
      .expect(403);
  });
});