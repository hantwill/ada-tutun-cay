import { Router } from 'express';
import { pool } from '../db.js';
import { sha256Hash } from '../auth.js';

const router = Router();

// Dashboard özet
router.get('/dashboard', async (_req, res) => {
  try {
    const bugunSatis = await pool.query(
      "SELECT COALESCE(SUM(toplam), 0) as toplam FROM adisyonlar WHERE date(kapanis_tarih) = date(NOW()) AND durum = 'kapali'"
    );
    const bugunAdet = await pool.query(
      "SELECT COUNT(*) as adet FROM adisyonlar WHERE date(kapanis_tarih) = date(NOW()) AND durum = 'kapali'"
    );
    const aktifAdisyon = await pool.query(
      "SELECT COUNT(*) as adet FROM adisyonlar WHERE durum = 'acik'"
    );
    const doluMasa = await pool.query(
      "SELECT COUNT(*) as adet FROM masalar WHERE durum = 'dolu'"
    );
    const toplamMasa = await pool.query("SELECT COUNT(*) as adet FROM masalar");
    const bugunGelir = await pool.query(
      "SELECT COALESCE(SUM(miktar), 0) as toplam FROM gelir_gider WHERE date(tarih) = date(NOW()) AND tip = 'gelir'"
    );
    const bugunGider = await pool.query(
      "SELECT COALESCE(SUM(miktar), 0) as toplam FROM gelir_gider WHERE date(tarih) = date(NOW()) AND tip = 'gider'"
    );
    res.json({
      bugun_satis: parseFloat(bugunSatis.rows[0].toplam),
      bugun_adet: parseInt(bugunAdet.rows[0].adet),
      aktif_adisyon: parseInt(aktifAdisyon.rows[0].adet),
      dolu_masa: parseInt(doluMasa.rows[0].adet),
      toplam_masa: parseInt(toplamMasa.rows[0].adet),
      bugun_gelir: parseFloat(bugunGelir.rows[0].toplam),
      bugun_gider: parseFloat(bugunGider.rows[0].toplam),
    });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Garson listesi
router.get('/garsonlar', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, telefon, ad, rol, aktif, olusturma_tarih FROM kullanicilar ORDER BY id'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Garson ekle
router.post('/garsonlar', async (req, res) => {
  const { telefon, ad, rol, sifre } = req.body;
  if (!telefon || !ad || !sifre) {
    return res.status(400).json({ hata: 'telefon, ad ve sifre gerekli' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO kullanicilar (telefon, ad, rol, sifre_hash) VALUES ($1, $2, $3, $4) RETURNING id, telefon, ad, rol, aktif, olusturma_tarih',
      [telefon, ad, rol || 'garson', sha256Hash(sifre)]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ hata: 'Bu telefon numarası zaten kayıtlı' });
    }
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Garson güncelle
router.put('/garsonlar/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { ad, rol, aktif } = req.body;
  try {
    await pool.query(
      'UPDATE kullanicilar SET ad = $1, rol = $2, aktif = $3 WHERE id = $4',
      [ad, rol, aktif, id]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Garson sil
router.delete('/garsonlar/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Son admin silinemez
    const adminCount = await pool.query("SELECT COUNT(*) as adet FROM kullanicilar WHERE rol = 'admin' AND aktif = true");
    const isAdmin = await pool.query("SELECT rol FROM kullanicilar WHERE id = $1", [id]);
    if (isAdmin.rows[0]?.rol === 'admin' && parseInt(adminCount.rows[0].adet) <= 1) {
      return res.status(400).json({ hata: 'Son admin silinemez' });
    }
    await pool.query('DELETE FROM kullanicilar WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Ürün ekle
router.post('/urunler', async (req, res) => {
  const { ad, kategoriId, fiyat } = req.body;
  if (!ad || !fiyat) {
    return res.status(400).json({ hata: 'ad ve fiyat gerekli' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO urunler (ad, kategori_id, fiyat) VALUES ($1, $2, $3) RETURNING *',
      [ad, kategoriId, fiyat]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Ürün güncelle
router.put('/urunler/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { ad, kategoriId, fiyat, aktif } = req.body;
  try {
    await pool.query(
      'UPDATE urunler SET ad = $1, kategori_id = $2, fiyat = $3, aktif = $4 WHERE id = $5',
      [ad, kategoriId, fiyat, aktif, id]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Ürün sil (soft delete)
router.delete('/urunler/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('UPDATE urunler SET aktif = false WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Masa ekle
router.post('/masalar', async (req, res) => {
  const { numara, ad, kapasite } = req.body;
  if (!numara) {
    return res.status(400).json({ hata: 'numara gerekli' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO masalar (numara, ad, kapasite) VALUES ($1, $2, $3) RETURNING *',
      [numara, ad, kapasite || 4]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ hata: 'Bu masa numarası zaten mevcut' });
    }
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Rapor — tarih aralığı
router.get('/rapor', async (req, res) => {
  const baslangic = req.query.baslangic as string;
  const bitis = req.query.bitis as string;
  if (!baslangic || !bitis) {
    return res.status(400).json({ hata: 'baslangic ve bitis gerekli' });
  }
  try {
    const adisyonlar = await pool.query(
      `SELECT a.*, k.ad as garson_ad, m.numara as masa_numara
       FROM adisyonlar a
       JOIN kullanicilar k ON a.garson_id = k.id
       JOIN masalar m ON a.masa_id = m.id
       WHERE date(a.kapanis_tarih) BETWEEN date($1) AND date($2)
       AND a.durum = 'kapali'
       ORDER BY a.kapanis_tarih DESC`,
      [baslangic, bitis]
    );
    const gelirGider = await pool.query(
      `SELECT * FROM gelir_gider WHERE date(tarih) BETWEEN date($1) AND date($2) ORDER BY tarih DESC`,
      [baslangic, bitis]
    );
    res.json({ adisyonlar: adisyonlar.rows, gelir_gider: gelirGider.rows });
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Gelir/gider ekle
router.post('/gelir-gider', async (req, res) => {
  const { tip, kategori, miktar, aciklama } = req.body;
  if (!tip || !miktar) {
    return res.status(400).json({ hata: 'tip ve miktar gerekli' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO gelir_gider (tip, kategori, miktar, aciklama) VALUES ($1, $2, $3, $4) RETURNING *',
      [tip, kategori, miktar, aciklama]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

export { router as adminRoutes };