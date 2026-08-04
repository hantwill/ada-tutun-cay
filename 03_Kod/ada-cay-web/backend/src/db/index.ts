import { Pool } from 'pg';
import dotenv from 'dotenv';

// dotenv sadece burada çağrılır (server.ts'te tekrar çağrılmayacak)
dotenv.config();

const dbPort = Number(process.env.DB_PORT || '5432');
if (Number.isNaN(dbPort)) {
  console.error('HATA: DB_PORT gecersiz');
  process.exit(1);
}

const dbPass = process.env.DB_PASS;
if (!dbPass) {
  console.error('HATA: DB_PASS env degiskeni tanimli degil!');
  process.exit(1);
}

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: dbPort,
  database: process.env.DB_NAME || 'ada_cay',
  user: process.env.DB_USER || 'postgres',
  password: dbPass,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,
});

export async function query<T = any>(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res;
  } finally {
    client.release();
  }
}