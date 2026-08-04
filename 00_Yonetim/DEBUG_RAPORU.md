# 🔍 DEBUG RAPORU — 04.08.2026

## Kritik Hatalar (Build/Runtime kırıcı)

### 1. ❌ Tauri frontendDist YOLU YANLIŞ
- **Dosya:** `src-tauri/tauri.conf.json`
- **Hata:** `"frontendDist": "../ada-tutun-desktop/dist"`
- **Gerçek:** `src-tauri/` zaten `ada-tutun-desktop/` içinde → path = `ada-tutun-desktop/ada-tutun-desktop/dist` (çift!)
- **Düzelt:** `"../dist"`

### 2. ❌ PostgreSQL CHECK constraint NULL hatası
- **Dosya:** `04_Veri_tabani/ada_cay_schema.sql` satır 56
- **Hata:** `CHECK(odeme_tipi IN ('nakit', 'kart', NULL))`
- **Gerçek:** PostgreSQL'de CHECK ile NULL bu şekilde çalışmaz
- **Düzelt:** `CHECK(odeme_tipi IS NULL OR odeme_tipi IN ('nakit', 'kart'))`

### 3. ❌ Garson login düz metin şifre karşılaştırması
- **Dosya:** `backend/src/routes/garson.ts` satır 11
- **Hata:** `sifre_hash = $2` — düz metin karşılaştırma, hash yok
- **Risk:** Şifre düz metin olarak DB'de duruyor ve düz karşılaştırılıyor
- **Düzelt:** bcrypt veya SHA256 hash kullanılmalı

### 4. ❌ PWA plugin vite.config.ts'de yok
- **Dosya:** `frontend/package.json` — `vite-plugin-pwa` var
- **Dosya:** `frontend/vite.config.ts` — plugin eklenmemiş
- **Sonuç:** PWA çalışmaz
- **Düzelt:** vite.config.ts'e plugin ekle

### 5. ❌ Tailwind config eksik
- **Dosya:** `frontend/` — tailwindcss kurulmuş
- **Hata:** `tailwind.config.js` ve `postcss.config.js` yok
- **Sonuç:** Tailwind CSS çalışmaz
- **Düzelt:** Config dosyaları ekle

## Orta Riskli Sorunlar

### 6. ⚠️ Tauri identifier default
- **Dosya:** `tauri.conf.json`
- **Hata:** `"identifier": "com.tauri.dev"` (default)
- **Düzelt:** `"com.ada.tutun"`

### 7. ⚠️ Socket.io CORS açık
- **Dosya:** `backend/src/server.ts`
- **Hata:** `cors: { origin: '*' }`
- **Risk:** Production'da herkes bağlanabilir
- **Düzelt:** LAN IP ile kısıtla

### 8. ⚠️ Backend tsconfig moduleResolution
- **Dosya:** `backend/tsconfig.json`
- **Hata:** `"moduleResolution": "bundler"` — Node.js backend için yanlış
- **Düzelt:** `"moduleResolution": "NodeNext"` + `"module": "NodeNext"`

### 9. ⚠️ .env git'e commit edilmiş olabilir
- **Dosya:** `backend/.env`
- **Kontrol:** git log'da var mı?

## Düşük Riskli

### 10. ℹ️ RAG script /tmp'de
- **Dosya:** `/tmp/rag_index.py`
- **Düzelt:** `06_RAG/` klasörüne taşı

### 11. ℹ️ Obsidian core-plugins.json minimal
- File explorer, search gibi default plugin'ler eksik

### 12. ℹ️ Backend error handling
- `catch (e)` — `e` tipi `unknown`, `e.message` erişimi yok
- TypeScript strict modda hata verebilir