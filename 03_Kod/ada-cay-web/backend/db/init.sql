-- Ada Çay Evi — PostgreSQL Şema
-- v1.0.0 — 05/08/2026

-- Garsonlar / Adminler
CREATE TABLE IF NOT EXISTS kullanicilar (
    id SERIAL PRIMARY KEY,
    kullanici_ad VARCHAR(50) UNIQUE NOT NULL,
    ad VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'garson' CHECK (rol IN ('admin', 'garson')),
    sifre_hash VARCHAR(255) NOT NULL,
    aktif BOOLEAN DEFAULT true,
    olusturma_tarih TIMESTAMP DEFAULT NOW()
);

-- Kategoriler
CREATE TABLE IF NOT EXISTS kategoriler (
    id SERIAL PRIMARY KEY,
    ad VARCHAR(100) UNIQUE NOT NULL,
    siralama INTEGER DEFAULT 0
);

-- Masalar
CREATE TABLE IF NOT EXISTS masalar (
    id SERIAL PRIMARY KEY,
    numara VARCHAR(10) NOT NULL UNIQUE,
    ad VARCHAR(50),
    kapasite INTEGER DEFAULT 4,
    durum VARCHAR(20) NOT NULL DEFAULT 'bos' CHECK (durum IN ('bos', 'dolu', 'rezerve')),
    guncelleme_tarih TIMESTAMP DEFAULT NOW()
);

-- Ürünler
CREATE TABLE IF NOT EXISTS urunler (
    id SERIAL PRIMARY KEY,
    ad VARCHAR(100) NOT NULL,
    kategori_id INTEGER REFERENCES kategoriler(id) ON DELETE SET NULL,
    fiyat DECIMAL(10,2) NOT NULL DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    olusturma_tarih TIMESTAMP DEFAULT NOW(),
    UNIQUE(ad, kategori_id)
);

-- Adisyonlar
CREATE TABLE IF NOT EXISTS adisyonlar (
    id SERIAL PRIMARY KEY,
    masa_id INTEGER NOT NULL REFERENCES masalar(id),
    garson_id INTEGER NOT NULL REFERENCES kullanicilar(id),
    durum VARCHAR(20) NOT NULL DEFAULT 'acik' CHECK (durum IN ('acik', 'kapali', 'odendi')),
    toplam DECIMAL(10,2) DEFAULT 0,
    odeme_tipi VARCHAR(20),
    acilis_tarih TIMESTAMP DEFAULT NOW(),
    kapanis_tarih TIMESTAMP
);

-- Adisyon Kalemleri
CREATE TABLE IF NOT EXISTS adisyon_kalemleri (
    id SERIAL PRIMARY KEY,
    adisyon_id INTEGER NOT NULL REFERENCES adisyonlar(id) ON DELETE CASCADE,
    urun_id INTEGER NOT NULL REFERENCES urunler(id),
    urun_ad VARCHAR(100) NOT NULL,
    birim_fiyat DECIMAL(10,2) NOT NULL,
    miktar INTEGER NOT NULL DEFAULT 1,
    toplam DECIMAL(10,2) NOT NULL,
    durum VARCHAR(20) DEFAULT 'siparis' CHECK (durum IN ('siparis', 'hazirlaniyor', 'hazir', 'servis', 'iptal')),
    ekleme_tarih TIMESTAMP DEFAULT NOW()
);

-- Gelir/Gider
CREATE TABLE IF NOT EXISTS gelir_gider (
    id SERIAL PRIMARY KEY,
    tip VARCHAR(10) NOT NULL CHECK (tip IN ('gelir', 'gider')),
    kategori VARCHAR(100),
    miktar DECIMAL(10,2) NOT NULL,
    aciklama TEXT,
    tarih TIMESTAMP DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_adisyonlar_masa ON adisyonlar(masa_id);
CREATE INDEX IF NOT EXISTS idx_adisyonlar_durum ON adisyonlar(durum);
CREATE INDEX IF NOT EXISTS idx_adisyon_kalemleri_adisyon ON adisyon_kalemleri(adisyon_id);
CREATE INDEX IF NOT EXISTS idx_urunler_kategori ON urunler(kategori_id);

-- Default veriler
INSERT INTO kategoriler (ad, siralama) VALUES
    ('Çaylar', 1),
    ('Kahveler', 2),
    ('Soğuk İçecekler', 3),
    ('Tatlılar', 4),
    ('Atıştırmalıklar', 5)
ON CONFLICT (ad) DO NOTHING;

-- Default admin (kullanici_ad: admin, şifre: admin123)
INSERT INTO kullanicilar (kullanici_ad, ad, rol, sifre_hash) VALUES
    ('admin', 'Yönetici', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (kullanici_ad) DO NOTHING;

-- Default masalar
INSERT INTO masalar (numara, ad, kapasite) VALUES
    ('1', 'Masa 1', 4),
    ('2', 'Masa 2', 4),
    ('3', 'Masa 3', 4),
    ('4', 'Masa 4', 6),
    ('5', 'Masa 5', 4),
    ('6', 'Masa 6', 2),
    ('7', 'Masa 7', 4),
    ('8', 'Terrace 1', 6),
    ('9', 'Terrace 2', 6),
    ('10', 'VIP', 8)
ON CONFLICT (numara) DO NOTHING;

-- Default ürünler
INSERT INTO urunler (ad, kategori_id, fiyat) VALUES
    ('Çay (demli)', 1, 15.00),
    ('Çay (tulum)', 1, 10.00),
    ('Bitki Çayı', 1, 20.00),
    ('Türk Kahvesi', 2, 25.00),
    ('Espresso', 2, 30.00),
    ('Cappuccino', 2, 35.00),
    ('Latte', 2, 40.00),
    ('Cola', 3, 25.00),
    ('Ayran', 3, 15.00),
    ('Limonata', 3, 30.00),
    ('Sütlaç', 4, 35.00),
    ('Baklava', 4, 60.00),
    ('Künefe', 4, 70.00),
    ('Kuru Pasta', 5, 20.00),
    ('Poğaça', 5, 15.00)
ON CONFLICT (ad, kategori_id) DO NOTHING;