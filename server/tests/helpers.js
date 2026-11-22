import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { runMigrations } from '../src/db/migrate.js';

export const app = createApp();

export async function setupDatabase() {
  await runMigrations();
}

export async function resetDatabase() {
  await pool.query('TRUNCATE readings, users RESTART IDENTITY CASCADE');
}

export async function closeDatabase() {
  await pool.end();
}

let counter = 0;

/** Registers a fresh user and returns a supertest agent that carries their login cookie. */
export async function createLoggedInAgent(overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const body = {
    name: 'Test User',
    email: `user${counter}@example.com`,
    password: 'Passw0rd!x',
    ...overrides,
  };
  const res = await agent.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`Could not register test user: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user, credentials: body };
}

export const reading = (overrides = {}) => ({
  date: '2025-03-10',
  slot: 'morning_fasting',
  value: 110,
  ...overrides,
});
