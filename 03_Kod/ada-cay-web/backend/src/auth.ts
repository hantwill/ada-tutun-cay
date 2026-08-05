import * as crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

// Şifre hashleme — bcrypt (12 rounds)
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}

// Şifre doğrula — önce bcrypt, değilse eski SHA-256 (migrasyon için)
export function verifyPassword(plain: string, hash: string): boolean {
  // Yeni bcrypt hash ($2a$ ile başlar)
  if (hash.startsWith('$2')) {
    return bcrypt.compareSync(plain, hash);
  }
  // Eski SHA-256 hash (migrasyon — giriş yapınca bcrypt'e güncellenecek)
  return crypto.createHash('sha256').update(plain).digest('hex') === hash;
}

// Eski SHA-256 (sadece init.sql seed için)
export function sha256Hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateToken(payload: object): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable gerekli!');
  }
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    // Timing-safe comparison
    if (header.length + body.length + signature.length < 10) return null;
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    // Token 24 saat geçerli
    if (Date.now() - payload.iat > 24 * 60 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}