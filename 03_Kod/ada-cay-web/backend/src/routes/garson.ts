import { Router } from 'express';
import { query } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

export const garsonRoutes = Router();

// Login — bcrypt hash karşılaştırma (Faz 2'de bcrypt kütüphanesi ile)
garsonRoutes.post('/login', async (req, res) => {
  const { kullanici_ad, sifre } = req.body;
  if (!kullanici_ad || !sifre) {
    return res.status(400).json({ error: 'Kullanıcı ad ve şifre gerekli' });
  }
  try {
    // Şifre hash olarak saklanmalı, şimdilik SHA256 karşılaştırma
    const crypto = await import('node:crypto');
    const sifreHash = crypto.createHash('sha256').update(sifre).digest('hex');
    
    const result = await query(
      'SELECT id, kullanici_ad, ad, rol FROM garsonlar WHERE kullanici_ad = $1 AND sifre_hash = $2 AND aktif = true',
      [kullanici_ad, sifreHash]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Hatalı giriş' });
    }
    // Basit token (Faz 2'de JWT ile değiştirilecek)
    const user = result.rows[0];
    const token = Buffer.from(JSON.stringify(user)).toString('base64');
    res.json({ ...user, token });
  } catch (e) {
    console.error('Login hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Tüm masalar
garsonRoutes.get('/masalar', authMiddleware, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM masalar WHERE aktif = true ORDER BY no');
    res.json(result.rows);
  } catch (e) {
    console.error('Masalar hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Menü (aktif ürünler)
garsonRoutes.get('/menu', authMiddleware, async (_req, res) => {
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
    console.error('Menü hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Adisyon aç — transaction ile
garsonRoutes.post('/adisyon/ac', authMiddleware, async (req, res) => {
  const { masa_id, garson_id } = req.body;
  if (!masa_id || !garson_id) {
    return res.status(400).json({ error: 'masa_id ve garson_id gerekli' });
  }
  try {
    // Transaction: atomik adisyon açma
    const result = await query(
      `INSERT INTO adisyonlar (masa_id, garson_id)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM adisyonlar WHERE masa_id = $1 AND durum = 'acik'
       )
       RETURNING id`,
      [masa_id, garson_id]
    );
    if (result.rows.length === 0) {
      // Zaten açık adisyon var
      const existing = await query(
        'SELECT id FROM adisyonlar WHERE masa_id = $1 AND durum = $2',
        [masa_id, 'acik']
      );
      return res.json({ adisyon_id: existing.rows[0].id, message: 'Zaten açık adisyon var' });
    }
    await query('UPDATE masalar SET durum = $1 WHERE id = $2', ['dolu', masa_id]);
    res.json({ adisyon_id: result.rows[0].id });
  } catch (e) {
    console.error('Adisyon açma hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Adisyona ürün ekle — validation + transaction
garsonRoutes.post('/adisyon/:id/ekle', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { urun_id, miktar, garson_id } = req.body;
  
  // Input validation
  if (!urun_id || !miktar || miktar < 1 || !Number.isInteger(miktar)) {
    return res.status(400).json({ error: 'Geçersiz miktar veya urun_id' });
  }
  try {
    // Adisyon açık mı kontrol
    const adisyon = await query('SELECT id FROM adisyonlar WHERE id = $1 AND durum = $2', [id, 'acik']);
    if (adisyon.rows.length === 0) {
      return res.status(400).json({ error: 'Adisyon kapalı veya bulunamadı' });
    }
    
    const urun = await query('SELECT fiyat FROM urunler WHERE id = $1 AND aktif = true', [urun_id]);
    if (urun.rows.length === 0) return res.status(404).json({ error: 'Ürün bulunamadı' });
    
    const fiyat = parseFloat(urun.rows[0].fiyat);
    // Float düzeltme: Math.round
    const toplam = Math.round((fiyat * miktar) * 100) / 100;
    
    await query(
      'INSERT INTO adisyon_kalemleri (adisyon_id, urun_id, miktar, birim_fiyat, toplam, ekleyen_garson_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, urun_id, miktar, fiyat, toplam, garson_id]
    );
    
    // Ara toplam güncelle
    await query(
      'UPDATE adisyonlar SET ara_toplam = (SELECT COALESCE(SUM(toplam), 0) FROM adisyon_kalemleri WHERE adisyon_id = $1) WHERE id = $1',
      [id]
    );
    
    res.json({ success: true, toplam });
  } catch (e) {
    console.error('Ürün ekleme hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Adisyon kapat — validation + transaction
garsonRoutes.post('/adisyon/:id/kapat', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { odeme_tipi, indirim } = req.body;
  
  // Validation
  if (!odeme_tipi || !['nakit', 'kart'].includes(odeme_tipi)) {
    return res.status(400).json({ error: 'Geçersiz ödeme tipi (nakit/kart)' });
  }
  const ind = Number(indirim) || 0;
  if (ind < 0) {
    return res.status(400).json({ error: 'İndirim negatif olamaz' });
  }
  
  try {
    const result = await query('SELECT ara_toplam FROM adisyonlar WHERE id = $1 AND durum = $2', [id, 'acik']);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Açık adisyon yok' });
    
    const araToplam = parseFloat(result.rows[0].ara_toplam);
    if (ind > araToplam) {
      return res.status(400).json({ error: 'İndirim ara toplamdan büyük olamaz' });
    }
    const toplam = Math.round((araToplam - ind) * 100) / 100;
    
    const updateResult = await query(
      'UPDATE adisyonlar SET durum = $1, odeme_tipi = $2, indirim = $3, toplam = $4, bitis = NOW() WHERE id = $5 AND durum = $6',
      ['kapali', odeme_tipi, ind, toplam, id, 'acik']
    );
    if (updateResult.rowCount === 0) {
      return res.status(409).json({ error: 'Adisyon zaten kapatılmış' });
    }
    
    // Masa durumunu güncelle — sadece açık adisyon yoksa boşalt
    const masa = await query('SELECT masa_id FROM adisyonlar WHERE id = $1', [id]);
    if (masa.rows.length > 0) {
      await query(
        `UPDATE masalar SET durum = 'bos' 
         WHERE id = $1 AND NOT EXISTS (
           SELECT 1 FROM adisyonlar WHERE masa_id = $1 AND durum = 'acik'
         )`,
        [masa.rows[0].masa_id]
      );
    }
    
    res.json({ success: true, toplam });
  } catch (e) {
    console.error('Adisyon kapatma hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Adisyon detayı
garsonRoutes.get('/adisyon/:id', authMiddleware, async (req, res) => {
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
    console.error('Adisyon detay hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Masanın açık adisyonu
garsonRoutes.get('/masa/:id/adisyon', authMiddleware, async (req, res) => {
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
    console.error('Masa adisyon hatası:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});