import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth.js';
import { pool } from '../db.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; kullanici_ad: string; ad: string; rol: string };
    }
  }
}

// Cache: 30 saniyede bir DB kontrol et (her istekte DB sorgulamamak için)
const userCache = new Map<number, { rol: string; aktif: boolean; ts: number }>();
const CACHE_TTL = 30_000; // 30 sn

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ hata: 'Token yok' });
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ hata: 'Geçersiz token format' });
  }
  const token = parts[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ hata: 'Geçersiz token' });
  }

  // DB'den güncel kullanıcı durumunu kontrol et (cache'li)
  const now = Date.now();
  let cached = userCache.get(payload.id);
  if (!cached || now - cached.ts > CACHE_TTL) {
    try {
      const result = await pool.query(
        'SELECT rol, aktif FROM kullanicilar WHERE id = $1',
        [payload.id]
      );
      if (result.rows.length === 0 || !result.rows[0].aktif) {
        return res.status(401).json({ hata: 'Kullanıcı pasif veya silinmiş' });
      }
      cached = { rol: result.rows[0].rol, aktif: result.rows[0].aktif, ts: now };
      userCache.set(payload.id, cached);
    } catch {
      // DB hatası — token payload güvenli fallback
      req.user = { id: payload.id, kullanici_ad: payload.kullanici_ad, ad: payload.ad, rol: payload.rol };
      next();
      return;
    }
  }

  // Rol değişmişse token'daki rolü DB'den güncelle
  req.user = {
    id: payload.id,
    kullanici_ad: payload.kullanici_ad,
    ad: payload.ad,
    rol: cached!.rol,
  };
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