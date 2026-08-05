import { Router } from 'express';
import { pool } from '../db.js';
import { sha256Hash, generateToken } from '../auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Garson login (kullanici_ad + şifre) — auth gerektirmez
router.post('/login', async (req, res) => {
  const { kullanici_ad, sifre } = req.body;
  if (!kullanici_ad || !sifre) {
    return res.status(400).json({ hata: 'Kullanıcı adı ve şifre gerekli' });
  }
  try {
    const result = await pool.query(
      'SELECT id, kullanici_ad, ad, rol FROM kullanicilar WHERE kullanici_ad = $1 AND sifre_hash = $2 AND aktif = true',
      [kullanici_ad, sha256Hash(sifre)]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ hata: 'Hatalı kullanıcı adı veya şifre' });
    }
    const user = result.rows[0];
    const token = generateToken({ id: user.id, kullanici_ad: user.kullanici_ad, ad: user.ad, rol: user.rol });
    res.json({ token, kullanici: user });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Tüm garson route'ları login sonrası auth gerektirir
router.use(authMiddleware);

// Tüm masalar
router.get('/masalar', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM masalar ORDER BY numara');
    res.json(result.rows);
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Masa adisyonu (açık adisyon varsa getir, yoksa null)
router.get('/masa/:id/adisyon', async (req, res) => {
  const masaId = parseInt(req.params.id);
  try {
    const adisyonResult = await pool.query(
      'SELECT * FROM adisyonlar WHERE masa_id = $1 AND durum = $2 ORDER BY id DESC LIMIT 1',
      [masaId, 'acik']
    );
    if (adisyonResult.rows.length === 0) {
      return res.json({ adisyon: null, kalemler: [] });
    }
    const adisyon = adisyonResult.rows[0];
    const kalemlerResult = await pool.query(
      'SELECT * FROM adisyon_kalemleri WHERE adisyon_id = $1 AND durum != $2 ORDER BY ekleme_tarih',
      [adisyon.id, 'iptal']
    );
    res.json({ adisyon, kalemler: kalemlerResult.rows });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Adisyon aç
router.post('/adisyon/ac', async (req, res) => {
  const { masaId } = req.body;
  const garsonId = (req as any).user.id;
  if (!masaId) {
    return res.status(400).json({ hata: 'masaId gerekli' });
  }
  try {
    // Açık adisyon var mı kontrol
    const existing = await pool.query(
      'SELECT id FROM adisyonlar WHERE masa_id = $1 AND durum = $2',
      [masaId, 'acik']
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ hata: 'Bu masada zaten açık adisyon var', adisyonId: existing.rows[0].id });
    }
    // Yeni adisyon aç
    const result = await pool.query(
      'INSERT INTO adisyonlar (masa_id, garson_id, durum) VALUES ($1, $2, $3) RETURNING *',
      [masaId, garsonId, 'acik']
    );
    // Masayı dolu yap
    await pool.query("UPDATE masalar SET durum = 'dolu', guncelleme_tarih = NOW() WHERE id = $1", [masaId]);
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Adisyona ürün ekle
router.post('/adisyon/:id/urun-ekle', async (req, res) => {
  const adisyonId = parseInt(req.params.id);
  const { urunId, miktar = 1 } = req.body;
  if (!urunId) {
    return res.status(400).json({ hata: 'urunId gerekli' });
  }
  try {
    // Ürünü getir
    const urunResult = await pool.query('SELECT ad, fiyat FROM urunler WHERE id = $1 AND aktif = true', [urunId]);
    if (urunResult.rows.length === 0) {
      return res.status(404).json({ hata: 'Ürün bulunamadı' });
    }
    const urun = urunResult.rows[0];
    const toplam = parseFloat(urun.fiyat) * miktar;
    // Adisyona ekle
    const result = await pool.query(
      'INSERT INTO adisyon_kalemleri (adisyon_id, urun_id, urun_ad, birim_fiyat, miktar, toplam) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [adisyonId, urunId, urun.ad, urun.fiyat, miktar, toplam]
    );
    // Adisyon toplamını güncelle
    await pool.query(
      'UPDATE adisyonlar SET toplam = (SELECT COALESCE(SUM(toplam), 0) FROM adisyon_kalemleri WHERE adisyon_id = $1 AND durum != $2) WHERE id = $1',
      [adisyonId, 'iptal']
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Adisyon kalemi iptal
router.delete('/adisyon/kalem/:kalemId', async (req, res) => {
  const kalemId = parseInt(req.params.kalemId);
  try {
    const kalemResult = await pool.query('SELECT adisyon_id FROM adisyon_kalemleri WHERE id = $1', [kalemId]);
    if (kalemResult.rows.length === 0) {
      return res.status(404).json({ hata: 'Kalem bulunamadı' });
    }
    const adisyonId = kalemResult.rows[0].adisyon_id;
    await pool.query("UPDATE adisyon_kalemleri SET durum = 'iptal' WHERE id = $1", [kalemId]);
    await pool.query(
      'UPDATE adisyonlar SET toplam = (SELECT COALESCE(SUM(toplam), 0) FROM adisyon_kalemleri WHERE adisyon_id = $1 AND durum != $2) WHERE id = $1',
      [adisyonId, 'iptal']
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Adisyon kapat (ödeme)
router.post('/adisyon/:id/kapat', async (req, res) => {
  const adisyonId = parseInt(req.params.id);
  const { odemeTipi } = req.body;
  if (!odemeTipi) {
    return res.status(400).json({ hata: 'odemeTipi gerekli' });
  }
  try {
    // Adisyon toplamını getir
    const adisyonResult = await pool.query('SELECT masa_id, toplam FROM adisyonlar WHERE id = $1 AND durum = $2', [adisyonId, 'acik']);
    if (adisyonResult.rows.length === 0) {
      return res.status(404).json({ hata: 'Açık adisyon bulunamadı' });
    }
    const { masa_id, toplam } = adisyonResult.rows[0];
    // Adisyonu kapat
    await pool.query(
      "UPDATE adisyonlar SET durum = 'kapali', kapanis_tarih = NOW(), odeme_tipi = $1 WHERE id = $2",
      [odemeTipi, adisyonId]
    );
    // Masayı boşalt
    await pool.query("UPDATE masalar SET durum = 'bos', guncelleme_tarih = NOW() WHERE id = $1", [masa_id]);
    // Gelir kaydet
    await pool.query(
      "INSERT INTO gelir_gider (tip, kategori, miktar, aciklama) VALUES ('gelir', 'Adisyon', $1, $2)",
      [toplam, `Adisyon #${adisyonId}`]
    );
    res.json({ ok: true, toplam });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Tüm ürünler (kategoriye göre)
router.get('/urunler', async (req, res) => {
  const kategoriId = req.query.kategori as string;
  try {
    let query = 'SELECT u.*, k.ad as kategori_ad FROM urunler u LEFT JOIN kategoriler k ON u.kategori_id = k.id WHERE u.aktif = true ORDER BY u.ad';
    let params: any[] = [];
    if (kategoriId) {
      query = 'SELECT u.*, k.ad as kategori_ad FROM urunler u LEFT JOIN kategoriler k ON u.kategori_id = k.id WHERE u.aktif = true AND u.kategori_id = $1 ORDER BY u.ad';
      params = [kategoriId];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Kategoriler
router.get('/kategoriler', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kategoriler ORDER BY siralama');
    res.json(result.rows);
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

export { router as garsonRoutes };