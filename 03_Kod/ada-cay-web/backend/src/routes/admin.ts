import { Router } from 'express';
import { query } from '../db/index.js';

export const adminRoutes = Router();

// Dashboard özeti
adminRoutes.get('/dashboard', async (_req, res) => {
  try {
    const bugunku = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN tip = 'gelir' THEN miktar ELSE 0 END), 0) as gelir,
        COALESCE(SUM(CASE WHEN tip = 'gider' THEN miktar ELSE 0 END), 0) as gider
      FROM gelir_gider 
      WHERE tarih::date = CURRENT_DATE
    `);
    const acikAdisyon = await query('SELECT COUNT(*) as count FROM adisyonlar WHERE durum = $1', ['acik']);
    const bugunSatis = await query(`
      SELECT COALESCE(SUM(toplam), 0) as toplam, COUNT(*) as adet 
      FROM adisyonlar 
      WHERE durum = 'kapali' AND bitis::date = CURRENT_DATE
    `);
    res.json({
      bugun_gelir: bugunku.rows[0].gelir,
      bugun_gider: bugunku.rows[0].gider,
      acik_adisyon: acikAdisyon.rows[0].count,
      bugun_satis_toplam: bugunSatis.rows[0].toplam,
      bugun_satis_adet: bugunSatis.rows[0].adet,
    });
  } catch (e) {
    console.error('Dashboard hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Açık adisyonlar (LEFT JOIN garsonlar — garson silinirse de görünür)
adminRoutes.get('/adisyonlar/acik', async (_req, res) => {
  try {
    const result = await query(`
      SELECT a.id, a.masa_id, m.no as masa_no, m.ad as masa_ad,
             a.garson_id, g.ad as garson_ad,
             a.baslangic, a.ara_toplam,
             (SELECT COUNT(*) FROM adisyon_kalemleri WHERE adisyon_id = a.id) as kalem_sayisi
      FROM adisyonlar a
      JOIN masalar m ON a.masa_id = m.id
      LEFT JOIN garsonlar g ON a.garson_id = g.id
      WHERE a.durum = 'acik'
      ORDER BY a.baslangic
    `);
    res.json(result.rows);
  } catch (e) {
    console.error('Açık adisyonlar hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Tarih arası rapor — validation'lı
adminRoutes.get('/rapor', async (req, res) => {
  const { baslangic, bitis } = req.query as { baslangic?: string; bitis?: string };
  if (!baslangic || !bitis) {
    return res.status(400).json({ error: 'baslangic ve bitis gerekli' });
  }
  const basDate = new Date(baslangic);
  const bitDate = new Date(bitis);
  if (Number.isNaN(basDate.getTime()) || Number.isNaN(bitDate.getTime())) {
    return res.status(400).json({ error: 'Geçersiz tarih formatı' });
  }
  if (basDate > bitDate) {
    return res.status(400).json({ error: 'baslangic bitis tarihinden sonra olamaz' });
  }
  try {
    const satislar = await query(`
      SELECT a.id, a.masa_id, m.no as masa_no, g.ad as garson_ad,
             a.baslangic, a.bitis, a.toplam, a.odeme_tipi, a.indirim
      FROM adisyonlar a
      JOIN masalar m ON a.masa_id = m.id
      LEFT JOIN garsonlar g ON a.garson_id = g.id
      WHERE a.durum = 'kapali' 
        AND a.bitis::date BETWEEN $1 AND $2
      ORDER BY a.bitis
    `, [baslangic, bitis]);

    const ozet = await query(`
      SELECT 
        COUNT(*) as adisyon_sayisi,
        COALESCE(SUM(toplam), 0) as toplam_ciro,
        COALESCE(SUM(CASE WHEN odeme_tipi = 'nakit' THEN toplam ELSE 0 END), 0) as nakit,
        COALESCE(SUM(CASE WHEN odeme_tipi = 'kart' THEN toplam ELSE 0 END), 0) as kart,
        COALESCE(SUM(indirim), 0) as toplam_indirim
      FROM adisyonlar
      WHERE durum = 'kapali' AND bitis::date BETWEEN $1 AND $2
    `, [baslangic, bitis]);

    res.json({ satislar: satislar.rows, ozet: ozet.rows[0] });
  } catch (e) {
    console.error('Rapor hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Gelir/gider ekle — validation'lı
adminRoutes.post('/gelir-gider', async (req, res) => {
  const { tip, kategori, miktar, aciklama, kullanici_id } = req.body;
  if (!tip || !['gelir', 'gider'].includes(tip)) {
    return res.status(400).json({ error: 'tip gelic veya gider olmalı' });
  }
  if (!miktar || miktar <= 0) {
    return res.status(400).json({ error: 'miktar pozitif olmalı' });
  }
  try {
    await query(
      'INSERT INTO gelir_gider (tip, kategori, miktar, aciklama, kullanici_id) VALUES ($1, $2, $3, $4, $5)',
      [tip, kategori, miktar, aciklama, kullanici_id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('Gelir-gider ekleme hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Gelir/gider listesi
adminRoutes.get('/gelir-gider', async (req, res) => {
  const { baslangic, bitis } = req.query as { baslangic?: string; bitis?: string };
  if (!baslangic || !bitis) {
    return res.status(400).json({ error: 'baslangic ve bitis gerekli' });
  }
  try {
    const result = await query(`
      SELECT * FROM gelir_gider 
      WHERE tarih::date BETWEEN $1 AND $2
      ORDER BY tarih DESC
    `, [baslangic, bitis]);
    res.json(result.rows);
  } catch (e) {
    console.error('Gelir-gider listesi hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Menü yönetimi
adminRoutes.get('/menu', async (_req, res) => {
  try {
    const result = await query(`
      SELECT u.*, k.ad as kategori_ad 
      FROM urunler u 
      LEFT JOIN kategoriler k ON u.kategori_id = k.id 
      ORDER BY k.sira, u.sira
    `);
    res.json(result.rows);
  } catch (e) {
    console.error('Menü listesi hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

adminRoutes.post('/menu', async (req, res) => {
  const { ad, kategori_id, fiyat } = req.body;
  if (!ad || ad.trim() === '') {
    return res.status(400).json({ error: 'Ürün adı gerekli' });
  }
  if (!fiyat || fiyat <= 0) {
    return res.status(400).json({ error: 'Fiyat pozitif olmalı' });
  }
  try {
    const result = await query(
      'INSERT INTO urunler (ad, kategori_id, fiyat) VALUES ($1, $2, $3) RETURNING id',
      [ad, kategori_id, fiyat]
    );
    res.json({ id: result.rows[0].id, success: true });
  } catch (e) {
    console.error('Menü ekleme hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

adminRoutes.put('/menu/:id', async (req, res) => {
  const { id } = req.params;
  const { ad, kategori_id, fiyat, aktif } = req.body;
  if (!ad || ad.trim() === '') {
    return res.status(400).json({ error: 'Ürün adı gerekli' });
  }
  if (fiyat !== undefined && fiyat <= 0) {
    return res.status(400).json({ error: 'Fiyat pozitif olmalı' });
  }
  try {
    await query(
      'UPDATE urunler SET ad = $1, kategori_id = $2, fiyat = $3, aktif = $4 WHERE id = $5',
      [ad, kategori_id, fiyat, aktif, id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('Menü güncelleme hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

adminRoutes.delete('/menu/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE urunler SET aktif = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Menü silme hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});