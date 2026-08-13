# Ada Çay Evi POS — Canlı Test Geri Bildirimleri

**Test Tarihi:** 13.08.2026
**Durum:** Canlı test başladı — 1 garson dijital adisyon kullanıyor, diğerleri kağıtla devam ediyor.

---

## Geri Bildirimler (Düzeltme Yapılmayacak — Test Bitince Uygulanacak)

### 1. Masa Sıralaması Karışık
- Masa 1'den sonra masa 10 geliyor (alfanümerik sıralama)
- İstenen: Numaratik sıralama (1, 2, 3, ..., 10, 11)
- Çözüm önerisi: Admin masaları sıralayabilsin (drag-drop veya manuel sıralama)
- **Öncelik:** Orta

### 2. Adisyon Kapatma Tuşu
- Yanlışlıkla adisyon açıldığında kapatma tuşu yok
- İstenen: "Masaya Dön" butonunun yanında "Adisyonu Kapat" butonu olsun
- **Öncelik:** Yüksek

### 3. Eski Adisyon Detay Görüntüleme
- Admin ve garsonlar eski adisyonların detayını göremiyor
- İstenen: Seçilen günde adisyon 1, adisyon 2 diye listelensin
- Her adisyon için: ne eklendi, fiyatı, kim açtı, kim kapattığı görülebilsin
- **Öncelik:** Yüksek

### 4. Masaları Serbest Konumlandırma (Freeform Layout)
- Masalar şu an grid halinde düzgün sıralı
- İstenen: Masalar beyaz fonda rastgele/serbest konumda yerleştirilebilsin
- Admin sürükle-bırak ile masaları istediği yere koyabilsin
- Garsonlar admin'in yerleştirdiği düzende görsün
- **Öncelik:** Orta

### 5. Masa Değiştirme / Taşıma
- Müşteri masadan masaya geçtiğinde adisyonu taşıma gerek
- İstenen: Açık adisyonu bir masadan diğerine taşıma özelliği
- Örnek: Masa 3'teki adisyonu Masa 4'e taşı, Masa 3 boşalsın, Masa 4 dolu olsun
- **Öncelik:** Yüksek

---

## Notlar
- Düzeltmeler canlı test bitince yapılacak
- Dükkan kapandığında haber verilecek, o zaman başlanılacak