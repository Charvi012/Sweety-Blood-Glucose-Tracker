import pg from 'pg';
import { config } from '../config/index.js';

// Return DATE columns (OID 1082) as plain 'YYYY-MM-DD' strings. By default node-pg turns
// them into JS Dates in the server's local time zone, which shifts days around.
pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 10 });

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});
