# Ada Tütün & Çay Evi

Açık kaynak satış, stok ve adisyon yönetim sistemi — iki yan yana mağaza için.

## Ada Tütün (Desktop POS)

Tauri 2 + React + TypeScript + SQLite tabanlı satış noktası.

### Özellikler
- **Login** — admin/satış rol bazlı yetki
- **Dashboard** — günlük satış, gelir, gider, kritik stok özeti
- **POS** — barkod okuyucu + tıklama ile satış, nakit/kart, indirim
- **Stok** — giriş/çıkış, hareket geçmişi
- **Ürünler** — CRUD, kategori, barkod, kritik seviye
- **Raporlar** — tarih aralığı, nakit/kart, Excel/CSV export
- **Gelir/Gider** — ciro entegrasyonu, net kiro hesabı
- **Shift** — aç/kapat, açılış/kapanış kasası
- **Kullanıcılar** — ekle/sil, şifre değiştir, rol yönetimi
- **Yedekleme** — DB export/import (SQLite VACUUM)

### Build
```bash
cd 03_Kod/ada-tutun-desktop
npm install
cargo tauri build
```

## Ada Çay Evi (Web PWA)

React PWA + Node.js + Express + Socket.io + PostgreSQL tabanlı garson adisyon sistemi.

### Özellikler (Backend hazır, frontend bekliyor)
- 15 masa, garson login, adisyon aç/kapat
- Socket.io ile canlı dashboard
- Admin panel, raporlama, gelir/gider

## Proje Yapısı
```
ada-tutun-cay/
├── 00_Yonetim/         # Proje raporu, yapılacaklar
├── 01_Dokumanlar/      # Gereksinimler, tasarım
├── 02_Teknik_Cizimler/ 
├── 03_Kod/
│   ├── ada-tutun-desktop/   # Tauri+React+SQLite
│   └── ada-cay-web/         # React PWA+Node.js+PG
├── 04_Veri_tabani/    # SQL şemaları
├── 05_Obsidian_Vault/ # Proje notları
├── 06_RAG/            # Qdrant index
├── 07_Test/
└── 08_Dağıtım/        # Platform builds
```

## Teknoloji
- **Ada Tütün:** Tauri 2.11, React 18, TypeScript, Tailwind, SQLite, Rust
- **Ada Çay Evi:** React 18, Vite PWA, Node.js, Express, Socket.io, PostgreSQL
- **Build:** GitHub Actions (Linux .deb, Windows .msi, macOS .dmg)

## Lisans
MIT — açık kaynak

## Geliştirici
NOVA ⚡🐱 (Hermes Agent)