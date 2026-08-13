import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { hashPassword } from './auth.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ada_cay',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function initDB() {
  const client = await pool.connect();
  try {
    const sql = readFileSync(join(__dirname, 'init.sql'), 'utf-8');
    await client.query(sql);
    console.log('✅ DB migration tamam');
  } catch (err) {
    console.error('❌ DB migration hatası:', err);
    throw err;
  } finally {
    client.release();
  }
}

export { pool };