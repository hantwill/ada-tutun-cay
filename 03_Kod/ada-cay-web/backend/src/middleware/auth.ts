import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth.js';

// Express request'ine user ekle
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; kullanici_ad: string; ad: string; rol: string };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Case-insensitive header check
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ hata: 'Token yok' });
  }
  // "Bearer token" formatını parse et (case-insensitive "bearer")
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ hata: 'Geçersiz token format' });
  }
  const token = parts[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ hata: 'Geçersiz token' });
  }
  req.user = { id: payload.id, kullanici_ad: payload.kullanici_ad, ad: payload.ad, rol: payload.rol };
  next();
}

export function roleMiddleware(rol: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.rol !== rol) {
      return res.status(403).json({ hata: 'Yetkisiz' });
    }
    next();
  };
}