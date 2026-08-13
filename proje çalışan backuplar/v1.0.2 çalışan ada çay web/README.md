# Ada Çay Evi — Kurulum Kılavuzu

## 📋 Gereksinimler

- **Docker** (v20+)
- **Docker Compose** (v2+)
- **Git**

---

## 🚀 Hızlı Kurulum (Tüm OS)

### 1. Repo'yu Klonlayın

```bash
git clone https://github.com/hantwill/ada-tutun-cay.git
cd ada-tutun-cay/03_Kod/ada-cay-web
```

### 2. Başlatın

```bash
docker compose up --build -d
```

### 3. Erişim

- **Web arayüz:** `http://localhost:5173`
- **API health:** `http://localhost:5173/api/health`
- **Giriş:** Kullanıcı adı: `admin` / Şifre: `admin123`

---

## 💻 OS Bazlı Kurulum

### Linux (Ubuntu/Debian)

```bash
# Docker yükle
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker

# Projeyi indir ve başlat
git clone https://github.com/hantwill/ada-tutun-cay.git
cd ada-tutun-cay/03_Kod/ada-cay-web
docker compose up --build -d
```

### Linux (Arch/Manjaro)

```bash
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
git clone https://github.com/hantwill/ada-tutun-cay.git
cd ada-tutun-cay/03_Kod/ada-cay-web
docker compose up --build -d
```

### macOS

```bash
# Docker Desktop yükle: https://docker.com/products/docker-desktop
# Terminal:
git clone https://github.com/hantwill/ada-tutun-cay.git
cd ada-tutun-cay/03_Kod/ada-cay-web
docker compose up --build -d
```

### Windows

```powershell
# Docker Desktop yükle: https://docker.com/products/docker-desktop
# PowerShell:
git clone https://github.com/hantwill/ada-tutun-cay.git
cd ada-tutun-cay\03_Kod\ada-cay-web
docker compose up --build -d
```

---

## 🌐 Uzaktan Erişim (Tailscale)

Diğer cihazlardan erişmek için:

1. [Tailscale](https://tailscale.com) yükle (hem sunucu hem cihaz)
2. Sunucuda: `tailscale up`
3. Sunucu IP'sini al: `tailscale ip`
4. Cihazdan eriş: `http://<tailscale-ip>:5173`

---

## 🔧 Yapılandırma

### Çevre Değişkenleri (docker-compose.yml)

| Değişken | Varsayılan | Açıklama |
|----------|-----------|----------|
| `JWT_SECRET` | `ada-cay-secret-2026` | JWT token imza anahtarı (**değiştirin!**) |
| `CORS_ORIGIN` | `*` | CORS izinli origin |
| `PORT` | `3001` | Backend port |
| `DB_USER` | `postgres` | DB kullanıcı |
| `DB_PASS` | `postgres` | DB şifre (**değiştirin!**) |

### Güvenlik Önerileri

```yaml
# docker-compose.yml'de değiştirin:
JWT_SECRET: "kendi-gizli-anahtariniz-32+karakter"
DB_PASS: "guclu-bir-sifre"
```

---

## 📱 Kullanım

### Admin Girişi
- Kullanıcı adı: `admin`
- Şifre: `admin123`
- **İlk kurulumda şifreyi değiştirin!**

### Admin Özellikleri
- 📊 **Dashboard:** Günlük satış, adisyon, masa durumu
- 👥 **Kullanıcılar:** Garson/admin ekle, sil, pasif yap
- 🍽️ **Ürünler:** Ürün ekle/sil, kategori seç, fiyat
- 💰 **Gelir/Gider:** Gelir/gider ekle, sil
- 📋 **Raporlar:** Tarih aralığı, Excel/CSV export

### Garson Özellikleri
- 🍽️ Masalar — seç, adisyon aç
- ➕ Ürün ekle (kategori filtreli)
- 💵 Nakit/Kart ile ödeme al
- ← Masadan çık, başka masaya geç

---

## 🔄 Güncelleme

```bash
cd ada-tutun-cay/03_Kod/ada-cay-web
git pull
docker compose up --build -d
```

## 🛑 Durdurma

```bash
docker compose down
```

## 🗑️ Tam Sıfırlama (DB dahil)

```bash
docker compose down -v
docker compose up --build -d
```

---

## 🏗️ Mimari

```
Browser → nginx (5173) → /api proxy → Express (3001) → PostgreSQL (5432)
                         ↕
                    Socket.io
```

| Container | Teknoloji | Port |
|-----------|-----------|------|
| Frontend | React + Vite + Tailwind v4 + PWA | 5173 |
| Backend | Node.js + Express + Socket.io | 3001 |
| Database | PostgreSQL 16 Alpine | 5432 |

---

## 🔒 Güvenlik

- ✅ bcrypt şifre hashleme (SHA-256'dan otomatik migrate)
- ✅ JWT token auth (24 saat geçerli)
- ✅ Helmet security headers
- ✅ Rate limiting (login: 10/15dk, genel: 100/dk)
- ✅ Transaction (adisyon aç/kapat)
- ✅ Unique index (masa başına tek açık adisyon)
- ✅ CSV formula injection koruması
- ✅ Authorization header case-insensitive
- ✅ Graceful shutdown
- ✅ Input validation

---

## 🐛 Sorun Giderme

### DB bağlanmıyor
```bash
docker compose down -v
docker compose up --build -d
# Bekle 15 sn, log kontrol:
docker logs ada-cay-web-backend-1
```

### Port çakışması
```bash
# 5173 veya 3001 başka process kullanıyor:
lsof -i :5173
lsof -i :3001
# docker-compose.yml'den port değiştir
```

### Build hatası
```bash
docker compose build --no-cache
docker compose up -d
```

---

## 📞 Destek

- **GitHub:** https://github.com/hantwill/ada-tutun-cay
- **Sürüm:** v1.0.2
- **Lisans:** MIT