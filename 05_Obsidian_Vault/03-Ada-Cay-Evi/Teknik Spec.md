---
project: ada-cay
type: spec
created: 2026-08-04
---

# Ada Çay Evi — Teknik Spec

## Sistem
- **Tip:** Web Application (PWA)
- **Platform:** Mobil tarayıcı (telefon)
- **Framework:** React PWA + Node.js/Express + TypeScript
- **Veritabanı:** PostgreSQL
- **Realtime:** Socket.io

## Roller
1. **Garson:** Telefondan adisyon aç/ürün ekle/kapat
2. **Admin:** Raporlar, gelir/gider, menü yönetimi, masa yönetimi

## Modüller
1. Garson Login (PWA, telefon)
2. Adisyon aç (masa seç)
3. Ürün ekle (çay, su, kahve, tatlı, vb.)
4. Adisyon kapat (nakit/kart)
5. Açık adisyonlar listesi
6. Admin Panel
7. Raporlama (günlük/haftalık/aylık/custom)
8. Gelir/Gider
9. Menü yönetimi
10. Masa yönetimi
11. Garson yönetimi
12. Dashboard (canlı)
13. Rapor export (PDF/Excel)

## DB Tabloları
- masalar, urunler, kategoriler, adisyonlar, adisyon_kalemleri
- garsonlar, gelir_gider

## Bilgerekler
- Kaç masa?
- Self servis mi?
- QR menü gerekli mi?
- Kaç garson?