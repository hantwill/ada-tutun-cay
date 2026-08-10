# 🍵 Ada Çay Evi — Web POS Sistemi

> Kafede garsonlar telefondan sipariş alır, admin panelden ürün/rapor yönetir. Docker'da çalışır, internet gerekmez.

## 📋 İçindekiler

- [Bu Nedir?](#bu-nedir)
- [Çalıştırmak için Ne Gerekir?](#çalıştırmak-için-ne-gerekir)
- [Nasıl Çalıştırılır? (Adım Adım)](#nasıl-çalıştırılır-adım-adım)
- [Giriş Bilgileri](#giriş-bilgileri)
- [Sistemi Başlatma](#sistemi-başlatma)
- [Sistemi Durdurma](#sistemi-durdurma)
- [Sıfırlama (Data Tabanını Temizleme)](#sıfırlama-data-tabanını-temizleme)
- [Neler Var?](#nelər-var)
- [Sorunlar ve Hızlı Çözümler](#sorunlar-ve-hızlı-çözümlər)
- [Docker Kaynak Kullanımı](#docker-kaynak-kullanımı)
- [Başka Bir Bilgisayarda Çalıştırma](#başka-bir-bilgisayarda-çalıştırma)
- [Telefondan Erişim](#telefondan-erişim)

---

## Bu Nedir?

Kafe için bir **sipariş yönetim sistemi**:

- **Garson** telefondan masaya gider, ürün seçer, sipariş girer, ödeme alır
- **Admin** ürün ekler/siler, fiyat değiştirir, gelir-gider girer, rapor alır
- **Docker** içinde çalışır → bilgisayara Node.js, PostgreSQL, React kurmana gerek yok
- **Internet gerekmez** → Tailscale ile telefondan lokale bağlanılır

## Çalıştırmak için Ne Gerekir?

Sadece **Docker**. Başka hiçbir şey.

| Gereksinim | Minimum | Önerilen |
|------------|---------|----------|
| **RAM** | 2 GB boş | 4 GB boş |
| **Disk** | 1.5 GB | 2 GB |
| **CPU** | 2 çekirdek | 4 çekirdek |
| **Docker** | v20+ | v24+ |
| **Docker Compose** | v2+ | v2.20+ |

> ⚠️ **Docker yok mu?** → [Docker indir](https://docs.docker.com/get-docker/)

## Nasıl Çalıştırılır? (Adım Adım)

```bash
# 1. Projeyi indir
git clone https://github.com/hantwill/ada-tutun-cay.git
cd ada-tutun-cay/03_Kod/ada-cay-web

# 2. Başlat (ilk sefer 3-5 dk sürer, image'ler build olur)
docker compose up -d --build

# 3. Hazır! Tarayıcıdan aç:
#    http://localhost:5173
#    Kullanıcı: admin
#    Şifre: admin123
```

Hepsi bu. Geri kalanı Docker halleder.

---

## Giriş Bilgileri

| Rol | Kullanıcı Adı | Şifre |
|-----|--------------|-------|
| Admin | `admin` | `admin123` |
| Garson | Admin panelinden eklenir | Eklerken belirlenir |

> 🔒 **Önemli:** İlk girişten sonra admin şifresini değiştir!

---

## Sistemi Başlatma

```bash
cd ada-tutun-cay/03_Kod/ada-cay-web

# Başlat (arka planda)
docker compose up -d

# Durum kontrol
docker compose ps

# Logları gör
docker compose logs -f
```

## Sistemi Durdurma

```bash
# Durdur (veriler kalır)
docker compose down

# Durdur + verileri sil (DİKKAT!)
docker compose down -v
```

## Sıfırlama (Data Tabanını Temizleme)

```bash
# Her şeyi sil + baştan başlat
docker compose down -v
docker compose up -d --build
```

> ⚠️ Bu işlem tüm masaları, ürünleri, siparişleri siler. Sistem ilk açılıştaki gibi olur.

---

## Neler Var?

### 👨‍🍳 Garson Ekranı
- Masa listesi (boş/dolu/rezerve)
- Sipariş girişi (ürün seç + adet)
- Ödeme alma (nakit/kart)
- Açık adisyon görüntüleme

### 👨‍💼 Admin Ekranı
- **Dashboard:** Bugünün satışları, dolu masalar, net gelir
- **Kullanıcılar:** Garson ekle/sil, aktif/pasif yap, rol değiştir
- **Ürünler:** Ekle, düzenle (modal), sil (onay modalı), kategori yönetimi
- **Gelir/Gider:** Manuel gelir-gider girişi, özet kartlar
- **Raporlar:** Tarih aralığı, adisyon listesi, gelir-gider tablosu, CSV indir

### 🛡️ Güvenlik
- JWT token auth
- bcrypt şifre hash
- Helmet security headers
- Rate limiting (10 deneme / 15 dk)
- Rol bazlı yetkilendirme (admin/garson)
- Input validation
- SQL injection koruması (parameterized queries)

---

## Sorunlar ve Hızlı Çözümler

### "Düzenle butonuna basıyorum hiçbir şey olmuyor"
**Sorun:** `prompt()` mobil tarayıcılarda engelli.
**Çözüm:** ✅ Düzeltildi. Artık modal açılır. Sayfayı hard refresh yap: `Ctrl+Shift+R`

### "Sil butonu çalışmıyor"
**Sorun:** `confirm()` mobilde "kararımı hatırla" ile engelleniyor.
**Çözüm:** ✅ Düzeltildi. Artık onay modalı açılır.

### "Aynı isimle ürün ekleyemiyorum, Sunucu hatası"
**Sorun:** DB'de `UNIQUE(ad, kategori_id)` constraint'i tüm satırlar için geçerliydi. Soft-delete sonrası satır kalıyordu.
**Çözüm:** ✅ Düzeltildi. Artık `WHERE aktif = true` partial index var. Silinen ürünlerin adı serbest.

### "Sayfa açılıyor ama boş/eksi"
**Sorun:** Browser cache eski JS'i yüküyor.
**Çözüm:** Hard refresh → `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`). Olmazsa cache temizle.

### "docker compose up diyince hata veriyor"
```bash
# Port kullanımda hatası:
# 5173 veya 3001 portu başka bir şey kullanıyor
# Çözüm: docker-compose.yml'de port değiştir
# örn: "5174:80" yap

# "Cannot connect to the Docker daemon"
# Docker çalışmıyor:
sudo systemctl start docker
```

### "Giriş yapamıyorum, token hatası"
**Sorun:** Backend henüz hazır değilmiş, token alınamıyor.
**Çözüm:** 10 saniye bekle. Backend log kontrol et:
```bash
docker compose logs backend
# "✅ Ada Çay Evi server" yazısını görmelisin
```

### "Ürün ekliyorum ama listede görünmüyor"
**Sorun:** Frontend cache'i eski veriyi gösteriyor.
**Çözüm:** Sayfa yenile. Olmazsa `yukleUrunler()` tetiklenmiyor olabilir — backend loglarına bak.

### "Telefondan giremiyorum"
**Sorun:** Tailscale bağlantısı yok veya IP yanlış.
**Çözüm:**
1. Bilgisayarda Tailscale kurulu ve aktif olmalı
2. Telefonda Tailscale VPN açık olmalı
3. `http://100.95.137.74:5173/` adresine git (Tailscale IP)

### "Veritabanını sıfırlamam lazım ama bilgiler kaybolsun istemiyorum"
```bash
# Yedek al
docker compose exec db pg_dump -U postgres ada_cay > yedek.sql

# Sıfırla
docker compose down -v
docker compose up -d --build

# Geri yükle
cat yedek.sql | docker compose exec -T db psql -U postgres -d ada_cay
```

### "Docker çok yer kaplıyor"
```bash
# Kullanılmayan image/temizlik
docker system prune -a

# Sadece build cache temizle
docker builder prune -a

# Build cache en çok yer kaplayan şeydir
# Bazen 5-10 GB olabilir
```

---

## Docker Kaynak Kullanımı

### Gerçek Ölçüm (i7-6700T, 16GB RAM)

| Container | RAM | CPU | Disk (Image) |
|-----------|-----|-----|-------------|
| **Frontend** (nginx) | ~8 MB | ~0% | 93 MB |
| **Backend** (Express) | ~19 MB | ~0% | 340 MB |
| **Database** (PostgreSQL) | ~25 MB | ~0% | 420 MB |
| **Toplam** | **~52 MB** | **~0%** | **~853 MB** |
| DB Volume | — | — | ~48 MB |

> 💡 **Çok hafif.** Toplam RAM kullanımı 52 MB — boş bir Chrome sekmesinden az.

### "Benim PC Buna Dayanır Mı?"

| Senaryo | RAM | Disk | Sonuç |
|---------|-----|------|-------|
| **Eski laptop (4GB)** | 52MB | 1.5GB | ✅ Rahat çalışır |
| **Ofis PC (8GB)** | 52MB | 1.5GB | ✅ Hiç belli olmaz |
| **Mini PC (2GB)** | 52MB | 1.5GB | ⚠️ Çalışır ama build sırasında 1-2GB RAM gerekir |
| **Raspberry Pi 4 (4GB)** | 52MB | 1.5GB | ✅ arm64 build gerekir, çalışır |

> ⚠️ **Build sırasında** geçici olarak 1-2GB ek RAM kullanılır. Build bitince normale döner. 2GB RAM'li makinede build sırasında zorlanabilir — swap açın.

### Build Sırasında PC Patlar Mı?

**Hayır.** Build sırasında:
- CPU: %80-100 (normal, geçici, build bitince düşer)
- RAM: 1-2 GB (geçici)
- Disk: 1.5 GB (kalıcı — image'ler)
- Süre: 3-5 dakika

Build bitince CPU %0'a düşer, RAM 52MB'a iner.

### "Docker image'ları çok yer kaplıyor"

```bash
# Build cache temizle (en çok yer kaplayan)
docker builder prune -a
# Bu bazen 5-10 GB boşaltır

# Kullanılmayan image'lar
docker image prune -a

# Genel temizlik
docker system prune -a
# Dikkat: sadece kullanılmayan her şeyi siler, çalışan container'lar etkilenmez
```

### RAM Limit Koymak (Opsiyonel)

Eğer Docker'ın çok RAM yemesini istemiyorsan, `docker-compose.yml`'de limit koy:

```yaml
services:
  db:
    deploy:
      resources:
        limits:
          memory: 256M
  backend:
    deploy:
      resources:
        limits:
          memory: 128M
  frontend:
    deploy:
      resources:
        limits:
          memory: 64M
```

> Bu sayede toplam ~448 MB'den fazlasını yiyemez.

---

## Başka Bir Bilgisayarda Çalıştırma

```bash
# 1. Projeyi indir
git clone https://github.com/hantwill/ada-tutun-cay.git
cd ada-tutun-cay/03_Kod/ada-cay-web

# 2. Başlat
docker compose up -d --build

# 3. Aç
# http://localhost:5173
# admin / admin123
```

> İlk build 3-5 dakika sürer. Sonraki başlatmalar 5 saniye.

### Dış Ağa Açma (Internet Üzerinden)

```bash
# Güvenli yöntem: Tailscale
# 1. Tailscale kur: https://tailscale.com
# 2. Bilgisayarda: tailscale up
# 3. Telefonda Tailscale VPN aç
# 4. http://<tailscale-ip>:5173/ ile gir
```

> ⚠️ Portu doğrudan internete açma (`0.0.0.0:5173:80`). Sadece Tailscale ile kullan.

---

## Telefondan Erişim

Sistem **mobil-first** tasarlanmıştır. Garsonlar telefondan Tailscale VPN ile bağlanır:

1. **Bilgisayarda Tailscale kurulu ve aktif** → `tailscale status` ile kontrol et
2. **Telefonda Tailscale VPN uygulaması** → App Store / Play Store'dan indir
3. **Aynı Tailscale hesabında** → Bilgisayar ve telefon aynı hesapta olmalı
4. **Tarayıcıdan gir** → `http://<bilgisayar-tailscale-ip>:5173/`

### Mobil Özellikler
- Tek kolon layout (telefon ekranına uygun)
- Büyük butonlar (parmakla dokunmaya uygun)
- Modal tabanlı düzenleme (prompt/confirm yok — mobil engelli)
- PWA desteği → Ana ekrana ekle, uygulama gibi açılır

---

## 📁 Proje Yapısı

```
ada-cay-web/
├── docker-compose.yml          # Docker orkestrasyon
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── server.ts          # Express + Socket.io
│   │   ├── db.ts              # PostgreSQL bağlantısı
│   │   ├── auth.ts            # JWT + bcrypt
│   │   ├── middleware/auth.ts  # JWT doğrulama
│   │   └── routes/
│   │       ├── garson.ts      # Garson API (login, masalar, sipariş)
│   │       └── admin.ts       # Admin API (dashboard, ürünler, raporlar)
│   └── db/
│       └── init.sql           # Veritabanı şeması + default veriler
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── src/
│       ├── main.tsx           # React entry
│       ├── App.tsx            # Router
│       ├── store.ts           # Zustand state + API fonksiyonları
│       └── pages/
│           ├── Login.tsx      # Giriş ekranı
│           ├── Masalar.tsx    # Garson: masa/sipariş ekranı
│           └── Admin.tsx      # Admin: dashboard/ürün/rapor
```

---

## 🛠️ Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Zustand |
| Backend | Node.js + Express + Socket.io |
| Database | PostgreSQL 16 |
| Auth | JWT + bcrypt |
| Güvenlik | Helmet + Rate limiting + Input validation |
| Deployment | Docker Compose |
| Mobile | PWA + Tailscale |

---

## 📞 İletişim

Soru/sorun için: [GitHub Issues](https://github.com/hantwill/ada-tutun-cay/issues)

---

## 📄 Lisans

Bu proje Ada Çay Evi içindir. Tüm hakları saklıdır.