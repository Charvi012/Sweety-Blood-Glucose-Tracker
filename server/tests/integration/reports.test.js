import { pool } from '../../src/db/pool.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, closeDatabase, createLoggedInAgent, resetDatabase, setupDatabase } from '../helpers.js';

beforeAll(setupDatabase);
beforeEach(resetDatabase);
afterAll(closeDatabase);

async function seed(agent, rows) {
  for (const [date, slot, value] of rows) {
    await agent.post('/api/readings').send({ date, slot, value }).expect(201);
  }
}

// Selected date used below: 15 Oct 2025
const SELECTED = '2025-10-15';

async function seedScenario(agent) {
  await seed(agent, [
    ['2025-08-31', 'morning_fasting', 400], // before previous month: excluded everywhere
    ['2025-09-01', 'morning_fasting', 90], // first day of previous month: included in monthly
    ['2025-09-30', 'morning_fasting', 111], // last day of previous month: included in monthly
    ['2025-10-01', 'morning_fasting', 180], // first day of this month: month-to-date only
    ['2025-10-15', 'after_dinner', 141],
    ['2025-10-15', 'morning_fasting', 100],
    ['2025-10-20', 'morning_fasting', 500], // after the selected date: excluded everywhere
  ]);
}

describe('GET /api/reports', () => {
  it('requires login', async () => {
    await request(app).get('/api/reports').query({ type: 'daily', date: SELECTED }).expect(401);
  });

  it('daily: only the selected date, with each reading and its slot', async () => {
    const { agent } = await createLoggedInAgent();
    await seedScenario(agent);

    const { body } = await agent.get('/api/reports').query({ type: 'daily', date: SELECTED }).expect(200);

    expect(body.report.range).toEqual({ from: '2025-10-15', to: '2025-10-15' });
    expect(body.report.summary).toEqual({ count: 2, highest: 141, lowest: 100, average: 120.5 });
    expect(body.report.readings.map((r) => [r.slotLabel, r.value])).toEqual([
      ['Morning (fasting)', 100],
      ['After dinner', 141],
    ]);
  });

  it('month-to-date: 1st of the month up to and including the selected date', async () => {
    const { agent } = await createLoggedInAgent();
    await seedScenario(agent);

    const { body } = await agent.get('/api/reports').query({ type: 'month-to-date', date: SELECTED }).expect(200);

    expect(body.report.range).toEqual({ from: '2025-10-01', to: '2025-10-15' });
    // (180 + 100 + 141) / 3 = 140.333... -> 140.3
    expect(body.report.summary).toEqual({ count: 3, highest: 180, lowest: 100, average: 140.3 });
    expect(body.report.readings).toBeUndefined();
  });

  it('monthly: the whole previous month, including its first and last day', async () => {
    const { agent } = await createLoggedInAgent();
    await seedScenario(agent);

    const { body } = await agent.get('/api/reports').query({ type: 'monthly', date: SELECTED }).expect(200);

    expect(body.report.range).toEqual({ from: '2025-09-01', to: '2025-09-30' });
    expect(body.report.summary).toEqual({ count: 2, highest: 111, lowest: 90, average: 100.5 });
  });

  it('monthly in January looks at December of the previous year', async () => {
    const { agent } = await createLoggedInAgent();
    await seed(agent, [['2024-12-31', 'after_lunch', 130]]);

    const { body } = await agent.get('/api/reports').query({ type: 'monthly', date: '2025-01-10' }).expect(200);

    expect(body.report.range).toEqual({ from: '2024-12-01', to: '2024-12-31' });
    expect(body.report.summary.count).toBe(1);
  });

  it('returns count 0 and null figures when there are no readings', async () => {
    const { agent } = await createLoggedInAgent();

    const { body } = await agent.get('/api/reports').query({ type: 'daily', date: SELECTED }).expect(200);

    expect(body.report.summary).toEqual({ count: 0, highest: null, lowest: null, average: null });
    expect(body.report.readings).toEqual([]);
  });

  it("never includes another user's readings", async () => {
    const a = await createLoggedInAgent();
    const b = await createLoggedInAgent();
    await seed(a.agent, [[SELECTED, 'morning_fasting', 100]]);
    await seed(b.agent, [[SELECTED, 'morning_fasting', 400]]);

    const { body } = await a.agent.get('/api/reports').query({ type: 'daily', date: SELECTED }).expect(200);
    expect(body.report.summary).toMatchObject({ count: 1, highest: 100 });
  });

  it.each([
    [{ type: 'weekly', date: SELECTED }],
    [{ type: 'daily', date: 'yesterday' }],
    [{ type: 'daily', date: '2999-01-01' }],
    [{ type: 'daily' }],
    [{ date: SELECTED }],
  ])('rejects invalid query %j', async (query) => {
    const { agent } = await createLoggedInAgent();
    await agent.get('/api/reports').query(query).expect(400);
  });
});
describe('GET /api/reports/patients/:patientId', () => {
  it('allows a doctor to view an assigned patient report', async () => {
    const doctor = await createLoggedInAgent({ role: 'doctor' });
    const patient = await createLoggedInAgent();

    await pool.query(
      `INSERT INTO doctor_patients (doctor_id, patient_id)
       VALUES ($1, $2)`,
      [doctor.user.id, patient.user.id],
    );

    await seed(patient.agent, [[SELECTED, 'morning_fasting', 120]]);

    const { body } = await doctor.agent
      .get(`/api/reports/patients/${patient.user.id}`)
      .query({ type: 'daily', date: SELECTED })
      .expect(200);

    expect(body.report.summary).toEqual({
      count: 1,
      highest: 120,
      lowest: 120,
      average: 120,
    });
  });

  it('blocks a doctor from viewing an unassigned patient report', async () => {
    const doctor = await createLoggedInAgent({ role: 'doctor' });
    const patient = await createLoggedInAgent();

    await doctor.agent
      .get(`/api/reports/patients/${patient.user.id}`)
      .query({ type: 'daily', date: SELECTED })
      .expect(403);
  });

  it('blocks a patient from accessing the Doctor report endpoint', async () => {
    const patient = await createLoggedInAgent();
    const anotherPatient = await createLoggedInAgent();

    await patient.agent
      .get(`/api/reports/patients/${anotherPatient.user.id}`)
      .query({ type: 'daily', date: SELECTED })
      .expect(403);
  });
});