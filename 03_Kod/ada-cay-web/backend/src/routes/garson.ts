import { Router } from 'express';
import { query } from '../db/index.js';

export const garsonRoutes = Router();

// Login
garsonRoutes.post('/login', async (req, res) => {
  const { kullanici_ad, sifre } = req.body;
  try {
    const result = await query(
      'SELECT id, kullanici_ad, ad, rol FROM garsonlar WHERE kullanici_ad = $1 AND sifre_hash = $2 AND aktif = true',
      [kullanici_ad, sifre]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Hatalı giriş' });
    }
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Tüm masalar
garsonRoutes.get('/masalar', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM masalar WHERE aktif = true ORDER BY no');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Menü (aktif ürünler)
garsonRoutes.get('/menu', async (_req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.ad, u.fiyat, k.ad as kategori 
      FROM urunler u 
      LEFT JOIN kategoriler k ON u.kategori_id = k.id 
      WHERE u.aktif = true 
      ORDER BY k.sira, u.sira
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Adisyon aç
garsonRoutes.post('/adisyon/ac', async (req, res) => {
  const { masa_id, garson_id } = req.body;
  try {
    // Önce o masada açık adisyon var mı kontrol
    const acik = await query(
      'SELECT id FROM adisyonlar WHERE masa_id = $1 AND durum = $2',
      [masa_id, 'acik']
    );
    if (acik.rows.length > 0) {
      return res.json({ adisyon_id: acik.rows[0].id, message: 'Zaten açık adisyon var' });
    }
    const result = await query(
      'INSERT INTO adisyonlar (masa_id, garson_id) VALUES ($1, $2) RETURNING id',
      [masa_id, garson_id]
    );
    await query('UPDATE masalar SET durum = $1 WHERE id = $2', ['dolu', masa_id]);
    res.json({ adisyon_id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Adisyona ürün ekle
garsonRoutes.post('/adisyon/:id/ekle', async (req, res) => {
  const { id } = req.params;
  const { urun_id, miktar, garson_id } = req.body;
  try {
    const urun = await query('SELECT fiyat FROM urunler WHERE id = $1', [urun_id]);
    if (urun.rows.length === 0) return res.status(404).json({ error: 'Ürün bulunamadı' });
    
    const fiyat = parseFloat(urun.rows[0].fiyat);
    const toplam = fiyat * miktar;
    
    await query(
      'INSERT INTO adisyon_kalemleri (adisyon_id, urun_id, miktar, birim_fiyat, toplam, ekleyen_garson_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, urun_id, miktar, fiyat, toplam, garson_id]
    );
    
    // Ara toplam güncelle
    await query(
      'UPDATE adisyonlar SET ara_toplam = (SELECT COALESCE(SUM(toplam), 0) FROM adisyon_kalemleri WHERE adisyon_id = $1) WHERE id = $1',
      [id]
    );
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Adisyon kapat (ödeme al)
garsonRoutes.post('/adisyon/:id/kapat', async (req, res) => {
  const { id } = req.params;
  const { odeme_tipi, indirim } = req.body;
  try {
    const result = await query('SELECT ara_toplam FROM adisyonlar WHERE id = $1 AND durum = $2', [id, 'acik']);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Açık adisyon yok' });
    
    const araToplam = parseFloat(result.rows[0].ara_toplam);
    const ind = indirim || 0;
    const toplam = araToplam - ind;
    
    await query(
      'UPDATE adisyonlar SET durum = $1, odeme_tipi = $2, indirim = $3, toplam = $4, bitis = NOW() WHERE id = $5',
      ['kapali', odeme_tipi, ind, toplam, id]
    );
    
    // Masa durumunu boşalt
    const masa = await query('SELECT masa_id FROM adisyonlar WHERE id = $1', [id]);
    if (masa.rows.length > 0) {
      await query('UPDATE masalar SET durum = $1 WHERE id = $2', ['bos', masa.rows[0].masa_id]);
    }
    
    res.json({ success: true, toplam });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Adisyon detayı
garsonRoutes.get('/adisyon/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const adisyon = await query(`
      SELECT a.*, m.no as masa_no, m.ad as masa_ad 
      FROM adisyonlar a 
      JOIN masalar m ON a.masa_id = m.id 
      WHERE a.id = $1
    `, [id]);
    const kalemler = await query(`
      SELECT ak.*, u.ad as urun_ad 
      FROM adisyon_kalemleri ak 
      JOIN urunler u ON ak.urun_id = u.id 
      WHERE ak.adisyon_id = $1
      ORDER BY ak.ekleme_zamani
    `, [id]);
    res.json({ adisyon: adisyon.rows[0], kalemler: kalemler.rows });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Masanın açık adisyonu
garsonRoutes.get('/masa/:id/adisyon', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'SELECT id FROM adisyonlar WHERE masa_id = $1 AND durum = $2',
      [id, 'acik']
    );
    if (result.rows.length === 0) {
      return res.json({ adisyon_id: null });
    }
    res.json({ adisyon_id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});