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

    // PENDING_INIT olan admin varsa rastgele şifre üret
    const pending = await client.query(
      "SELECT id FROM kullanicilar WHERE kullanici_ad = 'admin' AND sifre_hash = 'PENDING_INIT'"
    );
    if (pending.rows.length > 0) {
      const randomPass = randomBytes(6).toString('base64url').slice(0, 10);
      const hashed = hashPassword(randomPass);
      await client.query(
        'UPDATE kullanicilar SET sifre_hash = $1 WHERE id = $2',
        [hashed, pending.rows[0].id]
      );
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║  🔑 ADMIN GİRİŞ BİLGİLERİ (SADECE BİR KEZ)   ║');
      console.log('║  Kullanıcı adı: admin                        ║');
      console.log(`║  Şifre:          ${randomPass.padEnd(25)}║`);
      console.log('║  ⚠️  Şifreyi değiştirin!                     ║');
      console.log('╚══════════════════════════════════════════════╝');
    }
  } catch (err) {
    console.error('❌ DB migration hatası:', err);
    throw err;
  } finally {
    client.release();
  }
}

export { pool };