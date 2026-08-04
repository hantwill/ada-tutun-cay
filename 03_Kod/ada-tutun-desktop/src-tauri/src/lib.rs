use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// === DB STATE ===
pub struct DbState(pub Mutex<Connection>);

// === MODELS ===
#[derive(Serialize, Deserialize, Debug)]
pub struct Kullanici {
    pub id: i64,
    pub kullanici_ad: String,
    pub ad: String,
    pub rol: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Urun {
    pub id: i64,
    pub barkod: Option<String>,
    pub ad: String,
    pub kategori_id: Option<i64>,
    pub kategori_ad: Option<String>,
    pub alis_fiyat: f64,
    pub satis_fiyat: f64,
    pub stok: i64,
    pub kritik_seviye: i64,
    pub aktif: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SatisKalemi {
    pub urun_id: i64,
    pub urun_ad: String,
    pub miktar: i64,
    pub birim_fiyat: f64,
    pub toplam: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Satis {
    pub id: i64,
    pub tarih: String,
    pub kullanici_ad: String,
    pub ara_toplam: f64,
    pub indirim: f64,
    pub toplam: f64,
    pub odeme_tipi: String,
    pub durum: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DashboardData {
    pub bugun_satis: f64,
    pub bugun_adet: i64,
    pub bugun_gelir: f64,
    pub bugun_gider: f64,
    pub aktif_urun: i64,
    pub kritik_stok: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct StokHareket {
    pub id: i64,
    pub urun_id: i64,
    pub urun_ad: String,
    pub tip: String,
    pub miktar: i64,
    pub aciklama: Option<String>,
    pub tarih: String,
}

// === DB INIT ===
fn init_db(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS kategoriler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT NOT NULL UNIQUE,
            olusturma_tarih TEXT DEFAULT (datetime('now', 'localtime'))
        );
        CREATE TABLE IF NOT EXISTS kullanicilar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kullanici_ad TEXT NOT NULL UNIQUE,
            sifre_hash TEXT NOT NULL,
            rol TEXT NOT NULL CHECK(rol IN ('admin', 'satis')),
            ad TEXT NOT NULL,
            aktif INTEGER DEFAULT 1,
            olusturma_tarih TEXT DEFAULT (datetime('now', 'localtime'))
        );
        CREATE TABLE IF NOT EXISTS urunler (
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
        CREATE TABLE IF NOT EXISTS shiftler (
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
        CREATE TABLE IF NOT EXISTS satislar (
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
        CREATE TABLE IF NOT EXISTS satis_kalemleri (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            satis_id INTEGER NOT NULL,
            urun_id INTEGER NOT NULL,
            miktar INTEGER NOT NULL DEFAULT 1,
            birim_fiyat REAL NOT NULL,
            toplam REAL NOT NULL,
            FOREIGN KEY (satis_id) REFERENCES satislar(id) ON DELETE CASCADE,
            FOREIGN KEY (urun_id) REFERENCES urunler(id)
        );
        CREATE TABLE IF NOT EXISTS stok_hareketleri (
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
        CREATE TABLE IF NOT EXISTS gelir_gider (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tip TEXT NOT NULL CHECK(tip IN ('gelir', 'gider')),
            kategori TEXT,
            miktar REAL NOT NULL,
            aciklama TEXT,
            tarih TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            kullanici_id INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_urunler_barkod ON urunler(barkod);
        CREATE INDEX IF NOT EXISTS idx_satislar_tarih ON satislar(tarih);
        CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_urun ON stok_hareketleri(urun_id);
        CREATE INDEX IF NOT EXISTS idx_gelir_gider_tarih ON gelir_gider(tarih);
        "
    )?;

    // Default kategoriler
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM kategoriler", [], |r| r.get(0))?;
    if count == 0 {
        conn.execute_batch(
            "INSERT INTO kategoriler (ad) VALUES ('Sigara'), ('Mamuller'), ('Nargile'), ('Kibrit/Aksesuar'), ('Diger');"
        )?;
    }

    // Default admin
    let user_count: i64 = conn.query_row("SELECT COUNT(*) FROM kullanicilar", [], |r| r.get(0))?;
    if user_count == 0 {
        // SHA256("admin123") = 240be518fabd2724c98c8b3a0b9c9d9a...
        let hash = sha256_hash("admin123");
        conn.execute(
            "INSERT INTO kullanicilar (kullanici_ad, sifre_hash, rol, ad) VALUES ('admin', ?1, 'admin', 'Yonetici')",
            [&hash],
        )?;
    }

    Ok(())
}

fn sha256_hash(input: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    result.iter().map(|b| format!("{:02x}", b)).collect()
}

// === TAURI COMMANDS ===

#[tauri::command]
fn login(db: tauri::State<DbState>, kullanici_ad: String, sifre: String) -> Result<Option<Kullanici>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let hash = sha256_hash(&sifre);
    
    let result = conn.query_row(
        "SELECT id, kullanici_ad, ad, rol FROM kullanicilar WHERE kullanici_ad = ?1 AND sifre_hash = ?2 AND aktif = 1",
        rusqlite::params![kullanici_ad, hash],
        |row| Ok(Kullanici {
            id: row.get(0)?,
            kullanici_ad: row.get(1)?,
            ad: row.get(2)?,
            rol: row.get(3)?,
        }),
    );

    match result {
        Ok(k) => Ok(Some(k)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn get_urunler(db: tauri::State<DbState>) -> Result<Vec<Urun>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT u.id, u.barkod, u.ad, u.kategori_id, k.ad, u.alis_fiyat, u.satis_fiyat, u.stok, u.kritik_seviye, u.aktif
         FROM urunler u LEFT JOIN kategoriler k ON u.kategori_id = k.id
         WHERE u.aktif = 1 ORDER BY u.ad"
    ).map_err(|e| e.to_string())?;
    
    let urunler = stmt.query_map([], |row| {
        Ok(Urun {
            id: row.get(0)?,
            barkod: row.get(1)?,
            ad: row.get(2)?,
            kategori_id: row.get(3)?,
            kategori_ad: row.get(4)?,
            alis_fiyat: row.get(5)?,
            satis_fiyat: row.get(6)?,
            stok: row.get(7)?,
            kritik_seviye: row.get(8)?,
            aktif: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(urunler)
}

#[tauri::command]
fn get_urun_by_barkod(db: tauri::State<DbState>, barkod: String) -> Result<Option<Urun>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT u.id, u.barkod, u.ad, u.kategori_id, k.ad, u.alis_fiyat, u.satis_fiyat, u.stok, u.kritik_seviye, u.aktif
         FROM urunler u LEFT JOIN kategoriler k ON u.kategori_id = k.id
         WHERE u.barkod = ?1 AND u.aktif = 1",
        rusqlite::params![barkod],
        |row| Ok(Urun {
            id: row.get(0)?,
            barkod: row.get(1)?,
            ad: row.get(2)?,
            kategori_id: row.get(3)?,
            kategori_ad: row.get(4)?,
            alis_fiyat: row.get(5)?,
            satis_fiyat: row.get(6)?,
            stok: row.get(7)?,
            kritik_seviye: row.get(8)?,
            aktif: row.get(9)?,
        }),
    );
    match result {
        Ok(u) => Ok(Some(u)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn satis_yap(
    db: tauri::State<DbState>,
    kullanici_id: i64,
    odeme_tipi: String,
    indirim: f64,
    kalemler: Vec<SatisKalemi>,
) -> Result<i64, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    let ara_toplam: f64 = kalemler.iter().map(|k| k.toplam).sum();
    let toplam = ((ara_toplam - indirim) * 100.0).round() / 100.0;
    
    // Satış kaydı
    tx.execute(
        "INSERT INTO satislar (kullanici_id, ara_toplam, indirim, toplam, odeme_tipi) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![kullanici_id, ara_toplam, indirim, toplam, odeme_tipi],
    ).map_err(|e| e.to_string())?;
    
    let satis_id = tx.last_insert_rowid();
    
    // Kalemleri ekle + stok düş
    for k in &kalemler {
        tx.execute(
            "INSERT INTO satis_kalemleri (satis_id, urun_id, miktar, birim_fiyat, toplam) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![satis_id, k.urun_id, k.miktar, k.birim_fiyat, k.toplam],
        ).map_err(|e| e.to_string())?;
        
        // Stok düş
        tx.execute(
            "UPDATE urunler SET stok = stok - ?1, guncelleme_tarih = datetime('now', 'localtime') WHERE id = ?2",
            rusqlite::params![k.miktar, k.urun_id],
        ).map_err(|e| e.to_string())?;
        
        // Stok hareketi kaydet
        tx.execute(
            "INSERT INTO stok_hareketleri (urun_id, tip, miktar, aciklama, kullanici_id) VALUES (?1, 'cikis', ?2, 'Satis', ?3)",
            rusqlite::params![k.urun_id, k.miktar, kullanici_id],
        ).map_err(|e| e.to_string())?;
    }
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(satis_id)
}

#[tauri::command]
fn stok_gir(
    db: tauri::State<DbState>,
    urun_id: i64,
    miktar: i64,
    aciklama: Option<String>,
    kullanici_id: i64,
) -> Result<(), String> {
    if miktar <= 0 {
        return Err("Miktar pozitif olmali".to_string());
    }
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    let onceki: i64 = tx.query_row("SELECT stok FROM urunler WHERE id = ?1", [urun_id], |r| r.get(0)).map_err(|e| e.to_string())?;
    let yeni = onceki + miktar;
    
    tx.execute(
        "UPDATE urunler SET stok = ?1, guncelleme_tarih = datetime('now', 'localtime') WHERE id = ?2",
        rusqlite::params![yeni, urun_id],
    ).map_err(|e| e.to_string())?;
    
    tx.execute(
        "INSERT INTO stok_hareketleri (urun_id, tip, miktar, onceki_stok, yeni_stok, aciklama, kullanici_id) VALUES (?1, 'giris', ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![urun_id, miktar, onceki, yeni, aciklama, kullanici_id],
    ).map_err(|e| e.to_string())?;
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn stok_cik(
    db: tauri::State<DbState>,
    urun_id: i64,
    miktar: i64,
    aciklama: Option<String>,
    kullanici_id: i64,
) -> Result<(), String> {
    if miktar <= 0 {
        return Err("Miktar pozitif olmali".to_string());
    }
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    let onceki: i64 = tx.query_row("SELECT stok FROM urunler WHERE id = ?1", [urun_id], |r| r.get(0)).map_err(|e| e.to_string())?;
    if onceki < miktar {
        return Err("Yetersiz stok".to_string());
    }
    let yeni = onceki - miktar;
    
    tx.execute(
        "UPDATE urunler SET stok = ?1, guncelleme_tarih = datetime('now', 'localtime') WHERE id = ?2",
        rusqlite::params![yeni, urun_id],
    ).map_err(|e| e.to_string())?;
    
    tx.execute(
        "INSERT INTO stok_hareketleri (urun_id, tip, miktar, onceki_stok, yeni_stok, aciklama, kullanici_id) VALUES (?1, 'cikis', ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![urun_id, miktar, onceki, yeni, aciklama, kullanici_id],
    ).map_err(|e| e.to_string())?;
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn urun_ekle(
    db: tauri::State<DbState>,
    barkod: Option<String>,
    ad: String,
    kategori_id: Option<i64>,
    alis_fiyat: f64,
    satis_fiyat: f64,
    stok: i64,
    kritik_seviye: i64,
) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO urunler (barkod, ad, kategori_id, alis_fiyat, satis_fiyat, stok, kritik_seviye) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![barkod, ad, kategori_id, alis_fiyat, satis_fiyat, stok, kritik_seviye],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
fn urun_guncelle(
    db: tauri::State<DbState>,
    id: i64,
    barkod: Option<String>,
    ad: String,
    kategori_id: Option<i64>,
    alis_fiyat: f64,
    satis_fiyat: f64,
    kritik_seviye: i64,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE urunler SET barkod=?1, ad=?2, kategori_id=?3, alis_fiyat=?4, satis_fiyat=?5, kritik_seviye=?6, guncelleme_tarih=datetime('now', 'localtime') WHERE id=?7",
        rusqlite::params![barkod, ad, kategori_id, alis_fiyat, satis_fiyat, kritik_seviye, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn urun_sil(db: tauri::State<DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE urunler SET aktif=0 WHERE id=?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_dashboard(db: tauri::State<DbState>, kullanici_id: i64) -> Result<DashboardData, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let bugun_satis: f64 = conn.query_row(
        "SELECT COALESCE(SUM(toplam), 0) FROM satislar WHERE tarih::date = date('now', 'localtime') AND durum='tamamlandi'",
        [], |r| r.get(0),
    ).unwrap_or(0.0);
    
    let bugun_adet: i64 = conn.query_row(
        "SELECT COUNT(*) FROM satislar WHERE date(tarih)=date('now', 'localtime') AND durum='tamamlandi'",
        [], |r| r.get(0),
    ).unwrap_or(0);
    
    let bugun_gelir: f64 = conn.query_row(
        "SELECT COALESCE(SUM(miktar), 0) FROM gelir_gider WHERE date(tarih)=date('now', 'localtime') AND tip='gelir'",
        [], |r| r.get(0),
    ).unwrap_or(0.0);
    
    let bugun_gider: f64 = conn.query_row(
        "SELECT COALESCE(SUM(miktar), 0) FROM gelir_gider WHERE date(tarih)=date('now', 'localtime') AND tip='gider'",
        [], |r| r.get(0),
    ).unwrap_or(0.0);
    
    let aktif_urun: i64 = conn.query_row(
        "SELECT COUNT(*) FROM urunler WHERE aktif=1", [], |r| r.get(0)
    ).unwrap_or(0);
    
    let kritik_stok: i64 = conn.query_row(
        "SELECT COUNT(*) FROM urunler WHERE aktif=1 AND stok <= kritik_seviye", [], |r| r.get(0)
    ).unwrap_or(0);
    
    let _ = kullanici_id; // TODO: kullanici bazli filtre
    
    Ok(DashboardData {
        bugun_satis,
        bugun_adet,
        bugun_gelir,
        bugun_gider,
        aktif_urun,
        kritik_stok,
    })
}

#[tauri::command]
fn get_rapor(
    db: tauri::State<DbState>,
    baslangic: String,
    bitis: String,
) -> Result<Vec<Satis>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.tarih, k.ad, s.ara_toplam, s.indirim, s.toplam, s.odeme_tipi, s.durum
         FROM satislar s JOIN kullanicilar k ON s.kullanici_id = k.id
         WHERE date(s.tarih) BETWEEN date(?1) AND date(?2)
         ORDER BY s.tarih DESC"
    ).map_err(|e| e.to_string())?;
    
    let satislar = stmt.query_map(rusqlite::params![baslangic, bitis], |row| {
        Ok(Satis {
            id: row.get(0)?,
            tarih: row.get(1)?,
            kullanici_ad: row.get(2)?,
            ara_toplam: row.get(3)?,
            indirim: row.get(4)?,
            toplam: row.get(5)?,
            odeme_tipi: row.get(6)?,
            durum: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(satislar)
}

#[tauri::command]
fn gelir_gider_ekle(
    db: tauri::State<DbState>,
    tip: String,
    kategori: Option<String>,
    miktar: f64,
    aciklama: Option<String>,
    kullanici_id: Option<i64>,
) -> Result<i64, String> {
    if !["gelir", "gider"].contains(&tip.as_str()) {
        return Err("Tip gelir veya gider olmali".to_string());
    }
    if miktar <= 0.0 {
        return Err("Miktar pozitif olmali".to_string());
    }
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO gelir_gider (tip, kategori, miktar, aciklama, kullanici_id) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![tip, kategori, miktar, aciklama, kullanici_id],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
fn get_stok_hareketleri(
    db: tauri::State<DbState>,
    urun_id: Option<i64>,
    limit: Option<i64>,
) -> Result<Vec<StokHareket>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(50);
    
    let mut sql = String::from(
        "SELECT sh.id, sh.urun_id, u.ad, sh.tip, sh.miktar, sh.aciklama, sh.tarih
         FROM stok_hareketleri sh JOIN urunler u ON sh.urun_id = u.id"
    );
    let params: Vec<Box<dyn rusqlite::ToSql>> = if let Some(uid) = urun_id {
        sql.push_str(" WHERE sh.urun_id = ?1 ORDER BY sh.tarih DESC LIMIT ?2");
        vec![Box::new(uid), Box::new(lim)]
    } else {
        sql.push_str(" ORDER BY sh.tarih DESC LIMIT ?1");
        vec![Box::new(lim)]
    };
    
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    let hareketler = stmt.query_map(params_refs.as_slice(), |row| {
        Ok(StokHareket {
            id: row.get(0)?,
            urun_id: row.get(1)?,
            urun_ad: row.get(2)?,
            tip: row.get(3)?,
            miktar: row.get(4)?,
            aciklama: row.get(5)?,
            tarih: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(hareketler)
}

#[tauri::command]
fn get_kategoriler(db: tauri::State<DbState>) -> Result<Vec<(i64, String)>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, ad FROM kategoriler ORDER BY ad").map_err(|e| e.to_string())?;
    let kategoriler = stmt.query_map([], |row| {
        Ok((row.get(0)?, row.get(1)?))
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(kategoriler)
}

#[tauri::command]
fn shift_ac(db: tauri::State<DbState>, kullanici_id: i64, acilis_kasa: f64) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO shiftler (kullanici_id, acilis_kasa) VALUES (?1, ?2)",
        rusqlite::params![kullanici_id, acilis_kasa],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
fn shift_kapat(db: tauri::State<DbState>, shift_id: i64, kapanis_kasa: f64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE shiftler SET durum='kapali', bitis=datetime('now', 'localtime'), kapanis_kasa=?1, toplam_satis=(SELECT COALESCE(SUM(toplam),0) FROM satislar WHERE shift_id=?2) WHERE id=?2",
        rusqlite::params![kapanis_kasa, shift_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

// === MAIN ===
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_data_dir = std::env::current_dir().unwrap_or_default();
    let db_path = app_data_dir.join("ada_tutun.db");
    
    let conn = Connection::open(&db_path).expect("SQLite baglanamadi");
    init_db(&conn).expect("DB init hatasi");
    
    tauri::Builder::default()
        .manage(DbState(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            login,
            get_urunler,
            get_urun_by_barkod,
            satis_yap,
            stok_gir,
            stok_cik,
            urun_ekle,
            urun_guncelle,
            urun_sil,
            get_dashboard,
            get_rapor,
            gelir_gider_ekle,
            get_stok_hareketleri,
            get_kategoriler,
            shift_ac,
            shift_kapat,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}