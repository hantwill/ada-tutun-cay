# 🔍 DUAL MODEL DEBUG RAPORU — 04.08.2026
# minimax-m3:cloud (53 sorun) + kimi-k2.7-code:cloud (50 sorun)

## ORTAK KRİTİK SORUNLAR (Her iki model de buldu)

### 1. Düz Metin Şifre Karşılaştırması
- **Dosya:** garson.ts:11
- **Sorun:** `sifre_hash = $2` düz metin, hash yok
- **Düzelt:** bcrypt/argon2 kullan

### 2. Auth Middleware Yok
- **Dosya:** tüm route'lar
- **Sorun:** JWT/session yok, herkes API'ye erişebilir
- **Düzelt:** JWT + rol bazlı middleware

### 3. Admin Route'ları Herkese Açık
- **Dosya:** admin.ts (tüm)
- **Sorun:** Rol kontrolü yok, garson admin endpoint'lere erişebilir
- **Düzelt:** Admin-only middleware

### 4. Race Condition — Adisyon Açma
- **Dosya:** garson.ts:50-70
- **Sorun:** SELECT + INSERT atomik değil, 2 paralel istek = 2 adisyon
- **Düzelt:** Transaction + partial unique index

### 5. Tauri CSP Kapalı
- **Dosya:** tauri.conf.json:23
- **Sorun:** `"csp": null`
- **Düzelt:** Kısıtlayıcı CSP tanımla

### 6. Default DB Şifre
- **Dosya:** db/index.ts:11
- **Sorun:** postgres/postgres fallback
- **Düzelt:** Şifre yoksa başlatma

### 7. Tauri Komutları Yok
- **Dosya:** lib.rs
- **Sorun:** invoke_handler eksik, SQLite bağlantısı yok
- **Düzelt:** .manage() + .invoke_handler() ekle

### 8. Placeholder Şifreler
- **Dosya:** Her iki schema
- **Sorun:** `CHANGE_ME_HASH`
- **Düzelt:** Gerçek bcrypt hash

### 9. Input Validation Yok
- **Dosya:** garson.ts, admin.ts
- **Sorun:** miktar/fiyat/indirim negatif olabilir
- **Düzelt:** CHECK constraints + API validation

## KIMİ'NİN EK BULGULARI

### 10. Frontend Hayali Versiyonlar
- **Dosya:** frontend/package.json
- **Sorun:** React 19.2.8, Vite 8.2.0, TS 6.0.2 mevcut değil
- **Düzelt:** Gerçek versiyonlara sabitle

### 11. Partial Unique Index Eksik
- **Dosya:** PostgreSQL schema
- **Sorun:** Aynı masada 2 açık adisyon engellenmiyor
- **Düzelt:** `CREATE UNIQUE INDEX ON adisyonlar(masa_id) WHERE durum='acik'`

### 12. DB_PORT NaN Riski
- **Dosya:** db/index.ts:8
- **Sorun:** parseInt("abc") = NaN → çöküş
- **Düzelt:** Number.isNaN kontrolü

### 13. Body Limit Yok
- **Dosya:** server.ts:19
- **Sorun:** express.json() limitsiz → DoS
- **Düzelt:** `express.json({ limit: '10kb' })`

### 14. SSL/TLS Yok
- **Dosya:** db/index.ts
- **Sorun:** PostgreSQL şifresiz bağlantı
- **Düzelt:** SSL konfigürasyonu

### 15. Vite strictPort Yok
- **Dosya:** desktop/vite.config.ts
- **Sorun:** Port 1420 doluysa başka port → Tauri çöküş
- **Düzelt:** `strictPort: true`

## MINIMAX'IN EK BULGULARI

### 16. tsconfig Duplicate module Key
- **Dosya:** backend/tsconfig.json
- **Sorun:** `module` iki kez tanımlı (ESNext + NodeNext)
- **Düzelt:** Tek `NodeNext` bırak

### 17. Float Para Hesabı
- **Dosya:** garson.ts:80-81
- **Sorun:** `fiyat * miktar` = 37.500000000000004
- **Düzelt:** `Math.round((fiyat * miktar) * 100) / 100`

### 18. Tauri v2 Capabilities Eksik
- **Dosya:** capabilities/default.json
- **Sorun:** SQLite için permission yok
- **Düzelt:** Tauri v2 permission ekle

## ÖZET

| Kategori | Minimax | Kimi | Ortak | Toplam |
|----------|---------|------|-------|--------|
| KRİTİK | 9 | 20 | 9 | 20 |
| ORTA | 23 | 20 | ~15 | 28 |
| DÜŞÜK | 21 | 10 | ~8 | 23 |
| **TOPLAM** | **53** | **50** | — | **~71** |

## ÖNCELİK SIRASI (Deploy öncesi)
1. Şifre hash (bcrypt) + JWT auth + rol middleware
2. Frontend package.json versiyonlarını düzelt
3. Tauri lib.rs'e komutlar + SQLite bağlantısı ekle
4. Input validation + CHECK constraints
5. Transaction kullanımı (race condition)
6. Partial unique index (adisyon)
7. CSP + body limit + strictPort
8. Placeholder şifreleri değiştir