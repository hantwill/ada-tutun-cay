import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth.js';

// Express request'ine user ekle
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; telefon: string; ad: string; rol: string };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ hata: 'Token yok' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ hata: 'Geçersiz token' });
  }
  req.user = { id: payload.id, telefon: payload.telefon, ad: payload.ad, rol: payload.rol };
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