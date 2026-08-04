---
project: ada-tutun
type: spec
created: 2026-08-04
---

# Ada Tütün — Teknik Spec

## Sistem
- **Tip:** Desktop Application
- **Platform:** Linux, Windows, macOS
- **Framework:** Tauri + React + TypeScript
- **Veritabanı:** SQLite (yerel)

## Roller
1. **Satış Görevlisi:** Sadece satış yapar, kendi cirosunu görür
2. **Admin:** Stok, gelir/gider, raporlar, kullanıcı yönetimi

## Modüller
1. Login (rol bazlı)
2. POS / Satış ekranı
3. Stok yönetimi (giriş/çıkış)
4. Ürün & kategori yönetimi
5. Raporlama (günlük/haftalık/aylık/custom)
6. Gelir/Gider
7. Dashboard
8. Kullanıcı yönetimi
9. Yedekleme
10. Ayarlar

## DB Tabloları
- urunler, kategoriler, satislar, satis_kalemleri
- stok_hareketleri, gelir_gider, kullanicilar, shiftler

## Bilgerekler
- Barkod okuyucu var mı?
- Fiş yazıcı var mı?
- Kaç kasiyer?