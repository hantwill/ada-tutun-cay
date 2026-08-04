import { Request, Response, NextFunction } from 'express';
import * as crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('HATA: JWT_SECRET env degiskeni tanimli degil!');
  process.exit(1);
}

// HMAC-SHA256 imzalı token verify
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token yok' });
  }
  const token = authHeader.substring(7);
  try {
    const [payload64, sig] = token.split('.');
    if (!payload64 || !sig) {
      return res.status(401).json({ error: 'Geçersiz token formatı' });
    }
    // İmzayı doğrula
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET!).update(payload64).digest('hex');
    if (sig !== expectedSig) {
      return res.status(401).json({ error: 'Geçersiz imza' });
    }
    const payload = JSON.parse(Buffer.from(payload64, 'base64').toString('utf-8'));
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

export function roleMiddleware(rol: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.rol !== rol) {
      return res.status(403).json({ error: 'Yetkisiz' });
    }
    next();
  };
}