import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url));

/** Applies schema.sql. Every statement is idempotent, so it is safe to run repeatedly. */
export async function runMigrations() {
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(sql);
}
