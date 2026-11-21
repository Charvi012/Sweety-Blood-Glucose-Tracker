import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, closeDatabase, createLoggedInAgent, reading, resetDatabase, setupDatabase } from '../helpers.js';

beforeAll(setupDatabase);
beforeEach(resetDatabase);
afterAll(closeDatabase);

const SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

describe('authentication', () => {
  it.each([
    ['get', '/api/readings'],
    ['post', '/api/readings'],
    ['put', '/api/readings/00000000-0000-4000-8000-000000000000'],
    ['delete', '/api/readings/00000000-0000-4000-8000-000000000000'],
  ])('%s %s requires login', async (method, url) => {
    const res = await request(app)[method](url).send(reading());
    expect(res.status).toBe(401);
  });
});

describe('POST /api/readings', () => {
  it('creates a reading', async () => {
    const { agent } = await createLoggedInAgent();
    const res = await agent.post('/api/readings').send(reading({ slot: 'after_lunch', value: 135 }));

    expect(res.status).toBe(201);
    expect(res.body.reading).toMatchObject({
      date: '2025-03-10',
      slot: 'after_lunch',
      slotLabel: 'After lunch',
      value: 135,
    });
  });

  it('requires a value', async () => {
    const { agent } = await createLoggedInAgent();
    const res = await agent.post('/api/readings').send({ date: '2025-03-10', slot: 'after_lunch' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.value).toBe('Please enter a glucose value.');
  });

  it.each([39, 601, 99.5, 'abc'])('rejects value %j', async (value) => {
    const { agent } = await createLoggedInAgent();
    const res = await agent.post('/api/readings').send(reading({ value }));

    expect(res.status).toBe(400);
    expect(res.body.error.fields.value).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('rejects a future date', async () => {
    const { agent } = await createLoggedInAgent();
    const res = await agent.post('/api/readings').send(reading({ date: '2999-01-01' }));

    expect(res.status).toBe(400);
    expect(res.body.error.fields.date).toBe('Date cannot be in the future.');
  });

  it('rejects a second reading for the same slot and date', async () => {
    const { agent } = await createLoggedInAgent();
    await agent.post('/api/readings').send(reading({ slot: 'after_lunch' })).expect(201);
    const res = await agent.post('/api/readings').send(reading({ slot: 'after_lunch', value: 150 }));

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('You already have an After lunch reading for this date.');
  });

  it('rejects a fifth reading on one day', async () => {
    const { agent } = await createLoggedInAgent();
    for (const slot of SLOTS) await agent.post('/api/readings').send(reading({ slot })).expect(201);

    const res = await agent.post('/api/readings').send(reading({ slot: 'after_dinner', value: 99 }));
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('You can add only 4 readings per day.');
  });

  it('lets different users record the same slot on the same day', async () => {
    const a = await createLoggedInAgent();
    const b = await createLoggedInAgent();
    await a.agent.post('/api/readings').send(reading()).expect(201);
    await b.agent.post('/api/readings').send(reading()).expect(201);
  });

  it('ignores a user_id sent in the body', async () => {
    const a = await createLoggedInAgent();
    const b = await createLoggedInAgent();
    await a.agent.post('/api/readings').send({ ...reading(), user_id: b.user.id }).expect(201);

    expect((await b.agent.get('/api/readings')).body.readings).toHaveLength(0);
    expect((await a.agent.get('/api/readings')).body.readings).toHaveLength(1);
  });

  it('survives two concurrent requests for the same slot', async () => {
    const { agent } = await createLoggedInAgent();
    const results = await Promise.all([
      agent.post('/api/readings').send(reading({ value: 100 })),
      agent.post('/api/readings').send(reading({ value: 101 })),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });
});

describe('GET /api/readings', () => {
  it("returns only the logged-in user's readings, filtered by date, in slot order", async () => {
    const a = await createLoggedInAgent();
    const b = await createLoggedInAgent();
    await a.agent.post('/api/readings').send(reading({ slot: 'after_dinner', value: 140 }));
    await a.agent.post('/api/readings').send(reading({ slot: 'morning_fasting', value: 95 }));
    await a.agent.post('/api/readings').send(reading({ date: '2025-03-11', value: 100 }));
    await b.agent.post('/api/readings').send(reading({ value: 300 }));

    const res = await a.agent.get('/api/readings').query({ from: '2025-03-10', to: '2025-03-10' });

    expect(res.status).toBe(200);
    expect(res.body.readings.map((r) => r.slot)).toEqual(['morning_fasting', 'after_dinner']);
    expect(res.body.readings.every((r) => r.value !== 300)).toBe(true);
  });

  it('rejects an invalid date range', async () => {
    const { agent } = await createLoggedInAgent();
    const res = await agent.get('/api/readings').query({ from: '2025-03-10', to: '2025-03-01' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/readings/:id', () => {
  it('updates the value', async () => {
    const { agent } = await createLoggedInAgent();
    const { body } = await agent.post('/api/readings').send(reading({ value: 100 }));

    const res = await agent.put(`/api/readings/${body.reading.id}`).send(reading({ value: 125 }));

    expect(res.status).toBe(200);
    expect(res.body.reading.value).toBe(125);
  });

  it('allows saving a reading without changing its slot', async () => {
    const { agent } = await createLoggedInAgent();
    const { body } = await agent.post('/api/readings').send(reading({ slot: 'after_lunch' }));
    await agent.put(`/api/readings/${body.reading.id}`).send(reading({ slot: 'after_lunch', value: 130 })).expect(200);
  });

  it('rejects moving a reading into a slot that is already taken', async () => {
    const { agent } = await createLoggedInAgent();
    await agent.post('/api/readings').send(reading({ slot: 'after_lunch' }));
    const { body } = await agent.post('/api/readings').send(reading({ slot: 'after_dinner' }));

    const res = await agent.put(`/api/readings/${body.reading.id}`).send(reading({ slot: 'after_lunch' }));

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('You already have an After lunch reading for this date.');
  });

  it('rejects moving a reading to a day that already has 4', async () => {
    const { agent } = await createLoggedInAgent();
    for (const slot of SLOTS) await agent.post('/api/readings').send(reading({ date: '2025-03-11', slot }));
    const { body } = await agent.post('/api/readings').send(reading({ date: '2025-03-10' }));

    const res = await agent.put(`/api/readings/${body.reading.id}`).send(reading({ date: '2025-03-11' }));

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('You can add only 4 readings per day.');
  });

  it('applies the same validation as create', async () => {
    const { agent } = await createLoggedInAgent();
    const { body } = await agent.post('/api/readings').send(reading());
    const res = await agent.put(`/api/readings/${body.reading.id}`).send(reading({ value: 5 }));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/readings/:id', () => {
  it('deletes a reading', async () => {
    const { agent } = await createLoggedInAgent();
    const { body } = await agent.post('/api/readings').send(reading());

    await agent.delete(`/api/readings/${body.reading.id}`).expect(204);
    await agent.get(`/api/readings/${body.reading.id}`).expect(404);
  });

  it('frees the slot so it can be used again', async () => {
    const { agent } = await createLoggedInAgent();
    const { body } = await agent.post('/api/readings').send(reading());
    await agent.delete(`/api/readings/${body.reading.id}`).expect(204);
    await agent.post('/api/readings').send(reading()).expect(201);
  });
});

describe("other users' readings", () => {
  it('cannot be read, edited or deleted (looks like 404, not 403)', async () => {
    const owner = await createLoggedInAgent();
    const intruder = await createLoggedInAgent();
    const { body } = await owner.agent.post('/api/readings').send(reading({ value: 100 }));
    const url = `/api/readings/${body.reading.id}`;

    await intruder.agent.get(url).expect(404);
    await intruder.agent.put(url).send(reading({ value: 500 })).expect(404);
    await intruder.agent.delete(url).expect(404);

    const still = await owner.agent.get(url);
    expect(still.body.reading.value).toBe(100);
  });

  it('rejects a malformed id', async () => {
    const { agent } = await createLoggedInAgent();
    await agent.get('/api/readings/not-a-uuid').expect(400);
  });
});
