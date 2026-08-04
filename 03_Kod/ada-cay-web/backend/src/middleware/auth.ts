import { Request, Response, NextFunction } from 'express';

// JWT secret — env'den gelmeli
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Basit JWT verify (Faz 2'de jsonwebtoken kütüphanesi ile değiştirilecek)
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token yok' });
  }
  const token = authHeader.substring(7);
  try {
    // Basit base64 decode (Faz 2'de gerçek JWT verify)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);
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