import bcrypt from 'bcryptjs';
import { pool } from '../../db/pool.js';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/AppError.js';

const UNIQUE_VIOLATION = '23505';

const toPublicUser = (row) => ({ id: row.id, name: row.name, email: row.email });

let dummyHash;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync('not-a-real-password', config.BCRYPT_COST));

export async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, config.BCRYPT_COST);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash],
    );
    return toPublicUser(rows[0]);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const message = 'An account with this email already exists.';
      throw new AppError(409, 'EMAIL_TAKEN', message, { email: message });
    }
    throw err;
  }
}

export async function login({ email, password }) {
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE lower(email) = $1',
    [email],
  );
  const user = rows[0];
  // Always run a bcrypt compare, even for unknown emails, so response time does not
  // reveal which emails are registered.
  const matches = await bcrypt.compare(password, user ? user.password_hash : getDummyHash());
  if (!user || !matches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  return toPublicUser(user);
}

export async function getUserById(id) {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
  return rows[0] ? toPublicUser(rows[0]) : null;
}
