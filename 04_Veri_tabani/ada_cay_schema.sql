-- =====================================================
-- ADA ÇAY EVİ — PostgreSQL Şema
-- Web tabanlı adisyon sistemi (15 masa)
-- =====================================================

-- Kategoriler
CREATE TABLE kategoriler (
    id SERIAL PRIMARY KEY,
    ad VARCHAR(100) NOT NULL UNIQUE,
    sira INTEGER DEFAULT 0,
    olusturma_tarih TIMESTAMP DEFAULT NOW()
);

-- Garsonlar
CREATE TABLE garsonlar (
    id SERIAL PRIMARY KEY,
    kullanici_ad VARCHAR(50) NOT NULL UNIQUE,
    sifre_hash VARCHAR(255) NOT NULL,
    ad VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'garson' CHECK(rol IN ('garson', 'admin')),
    aktif BOOLEAN DEFAULT TRUE,
    olusturma_tarih TIMESTAMP DEFAULT NOW()
);

-- Masalar
CREATE TABLE masalar (
    id SERIAL PRIMARY KEY,
    no INTEGER NOT NULL UNIQUE,
    ad VARCHAR(50) NOT NULL,
    kapasite INTEGER DEFAULT 4,
    durum VARCHAR(20) DEFAULT 'bos' CHECK(durum IN ('bos', 'dolu', 'rezerve')),
    aktif BOOLEAN DEFAULT TRUE
);

-- Ürünler (Menü)
CREATE TABLE urunler (
    id SERIAL PRIMARY KEY,
    ad VARCHAR(100) NOT NULL,
    kategori_id INTEGER REFERENCES kategoriler(id),
    fiyat NUMERIC(10,2) NOT NULL DEFAULT 0,
    aktif BOOLEAN DEFAULT TRUE,
    sira INTEGER DEFAULT 0,
    olusturma_tarih TIMESTAMP DEFAULT NOW()
);

-- Adisyonlar
CREATE TABLE adisyonlar (
    id SERIAL PRIMARY KEY,
    masa_id INTEGER NOT NULL REFERENCES masalar(id),
    garson_id INTEGER NOT NULL REFERENCES garsonlar(id),
    baslangic TIMESTAMP NOT NULL DEFAULT NOW(),
    bitis TIMESTAMP,
    ara_toplam NUMERIC(10,2) DEFAULT 0,
    indirim NUMERIC(10,2) DEFAULT 0,
    toplam NUMERIC(10,2) DEFAULT 0,
    odeme_tipi VARCHAR(20) CHECK(odeme_tipi IN ('nakit', 'kart', NULL)),
    durum VARCHAR(20) DEFAULT 'acik' CHECK(durum IN ('acik', 'kapali', 'iptal')),
    notlar TEXT
);

-- Adisyon kalemleri
CREATE TABLE adisyon_kalemleri (
    id SERIAL PRIMARY KEY,
    adisyon_id INTEGER NOT NULL REFERENCES adisyonlar(id) ON DELETE CASCADE,
    urun_id INTEGER NOT NULL REFERENCES urunler(id),
    miktar INTEGER NOT NULL DEFAULT 1,
    birim_fiyat NUMERIC(10,2) NOT NULL,
    toplam NUMERIC(10,2) NOT NULL,
    ekleme_zamani TIMESTAMP DEFAULT NOW(),
    ekleyen_garson_id INTEGER REFERENCES garsonlar(id)
);

-- Gelir/Gider
CREATE TABLE gelir_gider (
    id SERIAL PRIMARY KEY,
    tip VARCHAR(10) NOT NULL CHECK(tip IN ('gelir', 'gider')),
    kategori VARCHAR(100),
    miktar NUMERIC(10,2) NOT NULL,
    aciklama TEXT,
    tarih TIMESTAMP NOT NULL DEFAULT NOW(),
    kullanici_id INTEGER REFERENCES garsonlar(id)
);

-- Indexler
CREATE INDEX idx_adisyonlar_masa ON adisyonlar(masa_id);
CREATE INDEX idx_adisyonlar_durum ON adisyonlar(durum);
CREATE INDEX idx_adisyonlar_tarih ON adisyonlar(baslangic);
CREATE INDEX idx_adisyon_kalemleri_adisyon ON adisyon_kalemleri(adisyon_id);
CREATE INDEX idx_urunler_kategori ON urunler(kategori_id);
CREATE INDEX idx_gelir_gider_tarih ON gelir_gider(tarih);

-- Default veri
INSERT INTO kategoriler (ad, sira) VALUES
    ('Çaylar', 1),
    ('Kahveler', 2),
    ('Soğuk İçecekler', 3),
    ('Tatlılar', 4),
    ('Atıştırmalık', 5),
    ('Diğer', 6);

-- 15 masa
INSERT INTO masalar (no, ad, kapasite) VALUES
    (1, 'Masa 1', 4), (2, 'Masa 2', 4), (3, 'Masa 3', 4),
    (4, 'Masa 4', 4), (5, 'Masa 5', 4), (6, 'Masa 6', 4),
    (7, 'Masa 7', 6), (8, 'Masa 8', 6), (9, 'Masa 9', 4),
    (10, 'Masa 10', 4), (11, 'Masa 11', 4), (12, 'Masa 12', 6),
    (13, 'Masa 13', 4), (14, 'Masa 14', 4), (15, 'Masa 15', 8);

-- Default menü
INSERT INTO urunler (ad, kategori_id, fiyat, sira) VALUES
    ('Çay (demlik)', 1, 35.00, 1),
    ('Çay (bardak)', 1, 15.00, 2),
    ('Türk Kahvesi', 2, 45.00, 1),
    ('Filtre Kahve', 2, 50.00, 2),
    ('Espresso', 2, 55.00, 3),
    ('Su', 3, 10.00, 1),
    ('Kola', 3, 30.00, 2),
    ('Ayran', 3, 25.00, 3),
    ('Baklava', 4, 80.00, 1),
    ('Sütlaç', 4, 50.00, 2),
    ('Tost', 5, 40.00, 1),
    ('Simit', 5, 20.00, 2);

-- Admin garson
INSERT INTO garsonlar (kullanici_ad, sifre_hash, ad, rol) VALUES
    ('admin', 'CHANGE_ME_HASH', 'Yönetici', 'admin'),
    ('garson1', 'CHANGE_ME_HASH', 'Garson 1', 'garson');