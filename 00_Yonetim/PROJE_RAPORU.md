# 📋 ADA TÜTÜN VE ÇAY — PROJE RAPORU

**Proje Adı:** Ada Tütün ve Çay  
**Tarih:** 04.08.2026  
**Hazırlayan:** NOVA  

---

## 1. PROJE ÖZETİ

İki yan yana mağazanın dijital sistemleri:

| Mağaza | Sistem Tipi | Platform | Kullanıcılar |
|--------|------------|----------|-------------|
| Ada Tütün | Desktop App (stok+satiş) | Linux + Windows + macOS | Satış görevlisi + Admin |
| Ada Çay Evi | Web App (adisyon) | Mobil tarayıcı (telefon) | Garson + Admin |

---

## 2. ADA TÜTÜN — DESKTOP SATIŞ PROGRAMI

### 2.1 Teknoloji Seçimi

**Önerilen:** Tauri + React + Rust
- **Tauri:** Cross-platform (Linux/Windows/macOS), hafif, güvenli
- **React:** UI framework, geniş ekosistem
- **Rust backend:** Hızlı, güvenli, yerel veritabanı
- **Alternatif:** Electron + React (daha ağır ama daha kolay)

### 2.2 Veritabanı

**Önerilen:** SQLite (yerel, kurulum gerektirmez)
- Tek dosya, portable
- Yedekleme kolay (dosya kopyala)
- Offline çalışır

### 2.3 Özellikler

#### Satış Görevlisi (Kasiyer)
- [ ] Ürün satışı (barkod/tıklama ile) — Barkod okuyucu VAR ✅
- [ ] Günlük satış özeti (kendi cirosu)
- [ ] Basit POS arayüzü
- [ ] Satış iade
- [ ] Shift aç/kapat

#### Admin
- [ ] Stok girişi (mal alma)
- [ ] Stok çıkışı (satış/ziyan/transfer)
- [ ] Gelir/gider kaydı
- [ ] Günlük/haftalık/aylık/seçili tarih arası rapor
- [ ] Ürün yönetimi (ekle/sil/fiyat güncelle)
- [ ] Kullanıcı yönetimi (satış görevlisi ekle/sil)
- [ ] Kategori yönetimi (tütün, nargile, kibrıt, vb.)
- [ ] Stok uyarısı (kritik seviye)
- [ ] Yedekleme (export/import) — Bulut yedek ✅
- [ ] Dashboard (günlük özet grafikleri)

> **Not:** Fiş yazıcı YOK. Vergi raporu Faz 2'de.

### 2.4 Veritabanı Şeması (Özet)

```
urunler (id, barkod, ad, kategori_id, alis_fiyat, satis_fiyat, stok, kritik_seviye)
kategoriler (id, ad)
satislar (id, tarih, kullanici_id, toplam, odeme_tipi)
satis_kalemleri (id, satis_id, urun_id, miktar, birim_fiyat, toplam)
stok_hareketleri (id, urun_id, tip[giris/cikis], miktar, tarih, aciklama, kullanici_id)
gelir_gider (id, tip[gelir/gider], miktar, kategori, aciklama, tarih)
kullanicilar (id, kullanici_ad, sifre_hash, rol[admin/satis], aktif)
shiftler (id, kullanici_id, baslangic, bitis, acilis_tutar, kapanis_tutar)
```

---

## 3. ADA ÇAY EVİ — WEB ADİSYON SİSTEMİ

### 3.1 Teknoloji Seçimi

**Önerilen:** React (PWA) + Node.js/Express + PostgreSQL
- **Frontend:** React PWA — telefona yüklenebilir, offline çalışabilir
- **Backend:** Node.js + Express
- **Veritabanı:** PostgreSQL (çok kullanıcılı, gerçek zamanlı)
- **WebSocket:** Socket.io — anlık adisyon güncelleme

### 3.2 Özellikler

#### Garson (Telefon)
- [ ] Adisyon aç (masa seç) — 15 masa ✅
- [ ] Ürün ekle (çay, su, kahve, tatlı, vb.)
- [ ] Adisyon kapat (nakit/kart seç)
- [ ] Açık adisyonları gör
- [ ] Masaya ürün ekle/çıkar

> **Not:** Garson servis + ödeme garsona. Self servis YOK. QR menü YOK.

#### Admin
- [ ] Tüm açık adisyonları gör (masa masa)
- [ ] Günlük/haftalık/aylık/seçili tarih arası gelir raporu
- [ ] Gelir/gider kaydı
- [ ] Ürün/menü yönetimi (ekle/sil/fiyat)
- [ ] Masa yönetimi (masa ekle/sil/kapat)
- [ ] Garson yönetimi
- [ ] Dashboard (canlı gelir, açık masa sayısı)
- [ ] Rapor export (PDF/Excel)

### 3.3 Veritabanı Şeması (Özet)

```
masalar (id, ad, aktif, status[bos/dolu])
urunler (id, ad, kategori_id, fiyat, aktif)
kategoriler (id, ad)
adisyonlar (id, masa_id, garson_id, baslangic, bitis, toplam, odeme_tipi, status[acik/kapali])
adisyon_kalemleri (id, adisyon_id, urun_id, miktar, birim_fiyat, toplam)
garsonlar (id, kullanici_ad, sifre_hash, aktif)
gelir_gider (id, tip, miktar, kategori, aciklama, tarih)
```

---

## 4. YAPILACAKLAR LİSTESİ

### Faz 1: Temel Altyapı (1-2 hafta)
- [x] Proje reposu oluştur (Git)
- [x] Tauri + React projesi init (Ada Tütün)
- [x] React PWA + Node.js projesi init (Ada Çay Evi)
- [x] Veritabanı şeması tasarla ve uygula
- [x] Obsidian Vault yapılandır
- [x] RAG sistemi kur (doküman indexing)

### Faz 2: Ada Tütün Desktop (2-3 hafta)
- [ ] Login ekranı (admin/satis rol)
- [ ] Ürün/kategori yönetimi
- [ ] Stok giriş/çıkış modülü
- [ ] Satış ekranı (POS)
- [ ] Raporlama (günlük/haftalık/aylık/custom)
- [ ] Gelir/gider modülü
- [ ] Dashboard
- [ ] Yedekleme
- [ ] Cross-platform build (Linux/Win/Mac)

### Faz 3: Ada Çay Evi Web (2-3 hafta)
- [ ] Garson login (telefon)
- [ ] Adisyon aç/ürün ekle/kapat
- [ ] Masa yönetimi
- [ ] Admin panel
- [ ] Raporlama
- [ ] Gelir/gider
- [ ] Dashboard (canlı)
- [ ] PWA yapılandırma (offline destek)
- [ ] Deploy (sunucu kurulumu)

### Faz 4: Test & Dağıtım (1 hafta)
- [ ] Unit test
- [ ] Integration test
- [ ] UAT (gerçek mağazada test)
- [ ] Windows/Linux/macOS build (Ada Tütün)
- [ ] Web deploy (Ada Çay Evi)
- [ ] Kullanıcı eğitimi
- [ ] Dokümantasyon

---

## 5. TEKNOLOJİ YIĞINI

### Ada Tütün (Desktop)
```
Frontend:  React + TypeScript + TailwindCSS
Backend:   Rust (Tauri) 
Database:  SQLite (rusqlite)
State:     Zustand
Build:     Tauri CLI → .exe / .deb / .dmg
```

### Ada Çay Evi (Web)
```
Frontend:  React + TypeScript + TailwindCSS (PWA)
Backend:   Node.js + Express + TypeScript
Database:  PostgreSQL
Realtime:  Socket.io
ORM:       Prisma
Deploy:    Docker + Nginx
```

### Ortak
```
Version:   Git (local repo /mnt/wd500)
Docs:      Obsidian Vault
RAG:       Qdrant (mevcut) + document indexing
Project:   /mnt/wd500/ada-tutun-cay/
```

---

## 6. DOSYA YAPISI

```
/mnt/wd500/ada-tutun-cay/
├── 00_Yonetim/          → Proje yönetim dosyaları
├── 01_Dokumanlar/       → Gereksinim, tasarım, toplantı notları
├── 02_Teknik_Cizimler/  → UI mockup'lar, diyagramlar
├── 03_Kod/
│   ├── ada-tutun-desktop/  → Tauri + React desktop app
│   └── ada-cay-web/        → React PWA + Node.js web app
├── 04_Veri_tabani/      → DB şema, migration, seed
├── 05_Obsidian_Vault/   → Obsidian notları
├── 06_RAG/              → RAG embedding + index
├── 07_Test/             → Test dosyaları
└── 08_Dağıtım/          → Build çıktıları (exe/deb/dmg/web)
```

---

## 7. RAG & OBSIDIAN

### Obsidian Vault
- Proje notları, toplantı özetleri, teknik kararlar
- Günlük çalışma logu
- `05_Obsidian_Vault/` klasörü direkt Obsidian'a açılacak

### RAG Sistemi
- Mevcut Qdrant (port 6333) kullanılacak
- Proje dokümanları, kod, teknik çizimler indexlenecek
- NOVA proje ile ilgili sorulara RAG üzerinden cevap verecek

---

## 8. SORULAR / CEVAPLAR

1. **Ada Tütün:** Barkod okuyucu olacak mı? → ✅ EVET
2. **Ada Tütün:** Fiş yazıcı gerekli mi? → ❌ HAYIR
3. **Ada Çay Evi:** Kaç masa var? → 15 masa
4. **Ada Çay Evi:** Self servis mi, garson mu? → Garson servis, ödeme garsona
5. **Ada Çay Evi:** Online sipariş (QR kod menü) gerekli mi? → ❌ HAYIR
6. **İkisi de:** Vergi daires raporu gerekli mi? → Faz 2'de
7. **İkisi de:** Bulut yedekleme mi, yerel yedek mi? → Bulut yedek
8. **Donanım:** PC/tablet var mı? → Windows PC = server + Ada Tütün app (RAM yükseltme bekleniyor)
9. **Ağ:** İki mağaza aynı LAN'da mı? → ✅ EVET, aynı LAN
10. **Bütçe:** Bütçe var mı? → Her şey ücretsiz/kendi yapımı, hazır yazılım alınmayacak

---

**Onay:** Bu raporu inceledikten sonra Faz 1'i başlatabiliriz.  
**Tahmini süre:** 6-8 hafta (iki sistem paralel geliştirilebilir)