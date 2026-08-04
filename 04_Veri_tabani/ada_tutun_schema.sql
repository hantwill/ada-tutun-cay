-- =====================================================
-- ADA TÜTÜN — SQLite Şema
-- Desktop satış & stok yönetim sistemi
-- =====================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Kategoriler
CREATE TABLE kategoriler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL UNIQUE,
    olusturma_tarih TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Kullanıcılar
CREATE TABLE kullanicilar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_ad TEXT NOT NULL UNIQUE,
    sifre_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'satis')),
    ad TEXT NOT NULL,
    aktif INTEGER DEFAULT 1,
    olusturma_tarih TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Ürünler
CREATE TABLE urunler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barkod TEXT UNIQUE,
    ad TEXT NOT NULL,
    kategori_id INTEGER,
    alis_fiyat REAL NOT NULL DEFAULT 0,
    satis_fiyat REAL NOT NULL DEFAULT 0,
    stok INTEGER NOT NULL DEFAULT 0,
    kritik_seviye INTEGER DEFAULT 5,
    aktif INTEGER DEFAULT 1,
    olusturma_tarih TEXT DEFAULT (datetime('now', 'localtime')),
    guncelleme_tarih TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (kategori_id) REFERENCES kategoriler(id)
);

-- Shiftler (kasiyer açılış/kapanış)
CREATE TABLE shiftler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_id INTEGER NOT NULL,
    baslangic TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    bitis TEXT,
    acilis_kasa REAL DEFAULT 0,
    kapanis_kasa REAL,
    toplam_satis REAL DEFAULT 0,
    durum TEXT DEFAULT 'acik' CHECK(durum IN ('acik', 'kapali')),
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
);

-- Satışlar
CREATE TABLE satislar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER,
    kullanici_id INTEGER NOT NULL,
    tarih TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    ara_toplam REAL NOT NULL DEFAULT 0,
    indirim REAL DEFAULT 0,
    toplam REAL NOT NULL DEFAULT 0,
    odeme_tipi TEXT NOT NULL CHECK(odeme_tipi IN ('nakit', 'kart')),
    durum TEXT DEFAULT 'tamamlandi' CHECK(durum IN ('tamamlandi', 'iptal', 'iade')),
    notlar TEXT,
    FOREIGN KEY (shift_id) REFERENCES shiftler(id),
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
);

-- Satış kalemleri
CREATE TABLE satis_kalemleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satis_id INTEGER NOT NULL,
    urun_id INTEGER NOT NULL,
    miktar INTEGER NOT NULL DEFAULT 1,
    birim_fiyat REAL NOT NULL,
    toplam REAL NOT NULL,
    FOREIGN KEY (satis_id) REFERENCES satislar(id) ON DELETE CASCADE,
    FOREIGN KEY (urun_id) REFERENCES urunler(id)
);

-- Stok hareketleri
CREATE TABLE stok_hareketleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    urun_id INTEGER NOT NULL,
    tip TEXT NOT NULL CHECK(tip IN ('giris', 'cikis', 'sayim')),
    miktar INTEGER NOT NULL,
    onceki_stok INTEGER,
    yeni_stok INTEGER,
    aciklama TEXT,
    kullanici_id INTEGER NOT NULL,
    tarih TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (urun_id) REFERENCES urunler(id),
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
);

-- Gelir/Gider
CREATE TABLE gelir_gider (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tip TEXT NOT NULL CHECK(tip IN ('gelir', 'gider')),
    kategori TEXT,
    miktar REAL NOT NULL,
    aciklama TEXT,
    tarih TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    kullanici_id INTEGER,
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
);

-- Indexler
CREATE INDEX idx_urunler_barkod ON urunler(barkod);
CREATE INDEX idx_urunler_kategori ON urunler(kategori_id);
CREATE INDEX idx_satislar_tarih ON satislar(tarih);
CREATE INDEX idx_satislar_kullanici ON satislar(kullanici_id);
CREATE INDEX idx_stok_hareketleri_urun ON stok_hareketleri(urun_id);
CREATE INDEX idx_gelir_gider_tarih ON gelir_gider(tarih);

-- Default veri
INSERT INTO kategoriler (ad) VALUES
    ('Sigara'),
    ('Mamuller'),
    ('Nargile'),
    ('Kibrıt/Aksesuar'),
    ('Diğer');

INSERT INTO kullanicilar (kullanici_ad, sifre_hash, rol, ad) VALUES
    ('admin', 'CHANGE_ME_HASH', 'admin', 'Yönetici');