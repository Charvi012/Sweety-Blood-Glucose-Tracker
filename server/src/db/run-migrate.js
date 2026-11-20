import { runMigrations } from './migrate.js';
import { pool } from './pool.js';

try {
  await runMigrations();
  console.log('Database schema is up to date.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
