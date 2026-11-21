import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, closeDatabase, createLoggedInAgent, resetDatabase, setupDatabase } from '../helpers.js';
import { pool } from '../../src/db/pool.js';

beforeAll(setupDatabase);
beforeEach(resetDatabase);
afterAll(closeDatabase);

const body = { name: 'Asha', email: 'asha@example.com', password: 'Passw0rd!x' };

describe('POST /api/auth/register', () => {
  it('creates a user, sets an httpOnly cookie and never returns the password', async () => {
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(String), name: 'Asha', email: 'asha@example.com', role: 'patient' });
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    expect(res.headers['set-cookie'][0]).toMatch(/SameSite=Strict/i);
  });
  it('creates a doctor account when doctor role is selected', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ ...body, email: 'doctor@example.com', role: 'doctor' });

  expect(res.status).toBe(201);
  expect(res.body.user).toEqual({
    id: expect.any(String),
    name: 'Asha',
    email: 'doctor@example.com',
    role: 'doctor',
  });
  });
  it('stores a bcrypt hash, not the plain-text password', async () => {
    await request(app).post('/api/auth/register').send(body);
    const { rows } = await pool.query('SELECT password_hash FROM users');
    expect(rows[0].password_hash).not.toBe(body.password);
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email regardless of letter case', async () => {
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send({ ...body, email: 'ASHA@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.fields.email).toBe('An account with this email already exists.');
  });

  it('returns per-field validation errors', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'nope', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.fields)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and allows access to /me', async () => {
    await request(app).post('/api/auth/register').send(body);
    const agent = request.agent(app);

    const login = await agent.post('/api/auth/login').send({ email: 'Asha@Example.com', password: body.password });
    expect(login.status).toBe(200);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('asha@example.com');
  });

  it('gives the same generic error for a wrong password and an unknown email', async () => {
    await request(app).post('/api/auth/register').send(body);

    const wrongPassword = await request(app).post('/api/auth/login').send({ email: body.email, password: 'WrongPass1' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'who@example.com', password: 'WrongPass1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe('Invalid email or password.');
    expect(unknownEmail.body.error).toEqual(wrongPassword.body.error);
  });
});

describe('session handling', () => {
  it('rejects /me without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'sweety_token=not.a.real-token');
    expect(res.status).toBe(401);
  });

  it('logout clears the cookie so later requests are unauthenticated', async () => {
    const { agent } = await createLoggedInAgent();
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    await agent.post('/api/auth/logout').expect(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});
