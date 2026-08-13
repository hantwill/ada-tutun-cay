import { useState, useEffect, useCallback } from 'react'
import { useStore, apiGet, apiPost, apiDelete } from '../store'

interface Masa {
  id: number
  numara: string
  ad: string | null
  kapasite: number
  durum: string
  pos_x: number | null
  pos_y: number | null
}

interface Adisyon {
  id: number
  masa_id: number
  garson_id: number
  durum: string
  toplam: string
}

interface Kalem {
  id: number
  adisyon_id: number
  urun_ad: string
  birim_fiyat: string
  miktar: number
  toplam: string
  durum: string
}

interface Urun {
  id: number
  ad: string
  fiyat: string
  kategori_ad: string | null
}

interface Kategori {
  id: number
  ad: string
}

export default function Masalar() {
  const { token, kullanici } = useStore()
  const [masalar, setMasalar] = useState<Masa[]>([])
  const [seciliMasa, setSeciliMasa] = useState<Masa | null>(null)
  const [adisyon, setAdisyon] = useState<Adisyon | null>(null)
  const [kalemler, setKalemler] = useState<Kalem[]>([])
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [kategoriler, setKategoriler] = useState<Kategori[]>([])
  const [seciliKategori, setSeciliKategori] = useState<string>('')
  const [mesaj, setMesaj] = useState('')
  const [tasiModal, setTasiModal] = useState(false)
  const [iptalOnay, setIptalOnay] = useState(false)
  const [planModu, setPlanModu] = useState(true)

  const mesajGoster = (m: string) => { setMesaj(m); setTimeout(() => setMesaj(''), 2500) }

  const yukleMasalar = useCallback(async () => {
    try { const data = await apiGet('/garson/masalar', token || undefined); setMasalar(data) } catch (e) { console.error(e) }
  }, [token])

  const yukleMenu = useCallback(async () => {
    try {
      const [urunData, katData] = await Promise.all([
        apiGet('/garson/urunler', token || undefined),
        apiGet('/garson/kategoriler', token || undefined)
      ])
      setUrunler(urunData); setKategoriler(katData)
    } catch (e) { console.error(e) }
  }, [token])

  useEffect(() => { yukleMasalar(); yukleMenu() }, [yukleMasalar, yukleMenu])

  const masaSec = async (masa: Masa) => {
    setSeciliMasa(masa)
    setAdisyon(null)   // eski adisyonu temizle
    setKalemler([])    // eski kalemleri temizle
    try {
      const data = await apiGet(`/garson/masa/${masa.id}/adisyon`, token || undefined)
      setAdisyon(data.adisyon); setKalemler(data.kalemler || [])
    } catch (e) { console.error(e) }
  }

  const masadanCik = () => {
    setSeciliMasa(null); setAdisyon(null); setKalemler([])
  }

  const adisyonAc = async () => {
    if (!seciliMasa || !kullanici) return
    try {
      const data = await apiPost('/garson/adisyon/ac', { masaId: seciliMasa.id }, token || undefined)
      setAdisyon(data); yukleMasalar(); mesajGoster('Adisyon açıldı')
    } catch (e: any) { mesajGoster(String(e.message || e)) }
  }

  const urunEkle = async (urun: Urun) => {
    if (!adisyon) return
    try {
      await apiPost(`/garson/adisyon/${adisyon.id}/urun-ekle`, { urunId: urun.id, miktar: 1 }, token || undefined)
      const data = await apiGet(`/garson/masa/${seciliMasa!.id}/adisyon`, token || undefined)
      setAdisyon(data.adisyon); setKalemler(data.kalemler || [])
    } catch (e) { console.error(e) }
  }

  const kalemIptal = async (kalemId: number) => {
    try {
      await apiDelete(`/garson/adisyon/kalem/${kalemId}`, token || undefined)
      const data = await apiGet(`/garson/masa/${seciliMasa!.id}/adisyon`, token || undefined)
      setAdisyon(data.adisyon); setKalemler(data.kalemler || [])
    } catch (e) { console.error(e) }
  }

  const adisyonKapat = async (odemeTipi: string) => {
    if (!adisyon) return
    try {
      await apiPost(`/garson/adisyon/${adisyon.id}/kapat`, { odemeTipi }, token || undefined)
      setAdisyon(null); setKalemler([]); setSeciliMasa(null); yukleMasalar()
      mesajGoster('Adisyon kapatıldı ✓')
    } catch (e: any) { mesajGoster(String(e.message || e)) }
  }

  const adisyonIptal = async () => {
    setIptalOnay(false)
    if (!adisyon) return
    try {
      await apiPost(`/garson/adisyon/${adisyon.id}/iptal`, {}, token || undefined)
      setAdisyon(null); setKalemler([]); setSeciliMasa(null); yukleMasalar()
      mesajGoster('Adisyon iptal edildi')
    } catch (e: any) { mesajGoster(String(e.message || e)) }
  }

  const adisyonTasi = async (hedefMasaId: number) => {
    if (!adisyon) return
    try {
      await apiPost(`/garson/adisyon/${adisyon.id}/tasi`, { hedefMasaId }, token || undefined)
      const yeniMasa = masalar.find(m => m.id === hedefMasaId)
      setSeciliMasa(yeniMasa || null)
      setTasiModal(false); yukleMasalar()
      mesajGoster('Adisyon taşındı ✓')
    } catch (e: any) { mesajGoster(String(e.message || e)) }
  }

  const filtreliUrunler = seciliKategori ? urunler.filter(u => u.kategori_ad === seciliKategori) : urunler

  // === MASA LİSTESİ (telefon ekranı) ===
  if (!seciliMasa) {
    return (
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-amber-800">🍽️ Masalar</h2>
          <button onClick={() => setPlanModu(!planModu)}
            className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200 transition">
            {planModu ? '📋 Liste' : '📐 Plan'}
          </button>
        </div>

        {planModu ? (
          /* Plan modu — masalar pozisyonlarına göre */
          <div className="relative bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-2xl overflow-hidden min-h-[400px]"
            style={{ touchAction: 'pan-y' }}>
            {masalar.map((m) => (
              <button key={m.id} onClick={() => masaSec(m)}
                className={`absolute w-20 sm:w-28 h-16 sm:h-24 rounded-xl flex flex-col items-center justify-center transition font-semibold text-xs sm:text-sm select-none ${
                  m.durum === 'dolu' ? 'bg-red-100 border-2 border-red-300 text-red-700 hover:bg-red-200' : 'bg-white border-2 border-amber-200 text-gray-700 hover:bg-amber-100 shadow-sm'
                }`}
                style={{ left: `${m.pos_x ?? 0}%`, top: `${m.pos_y ?? 0}%` }}>
                <div className="text-sm sm:text-base font-bold leading-tight text-center px-1">{m.ad || `Masa ${m.numara}`}</div>
                <div className="text-xs opacity-60 hidden sm:block">{m.kapasite} kişilik</div>
                {m.durum === 'dolu' && <div className="text-xs mt-0.5">🔵</div>}
              </button>
            ))}
          </div>
        ) : (
          /* Grid modu — klasik liste */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {masalar.map((m) => (
              <button key={m.id} onClick={() => masaSec(m)}
                className={`p-3 sm:p-4 rounded-xl text-center transition font-semibold text-sm sm:text-base ${
                  m.durum === 'dolu' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-white text-gray-700 hover:bg-amber-100 shadow-sm'
                }`}>
                <div className="text-lg">{m.ad || `Masa ${m.numara}`}</div>
                <div className="text-xs opacity-60">{m.kapasite} kişilik</div>
                {m.durum === 'dolu' && <div className="text-xs mt-1">🔵 Dolu</div>}
              </button>
            ))}
          </div>
        )}

        {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-50">{mesaj}</div>}
      </div>
    )
  }

  // === ADİSYON EKRANI (seçili masa) ===
  return (
    <div className="flex flex-col h-full">
      {/* Üst bar — masa adı + çık butonu */}
      <div className="flex items-center justify-between bg-amber-900 text-white px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold">{seciliMasa.ad || `Masa ${seciliMasa.numara}`}</span>
          {adisyon && <span className="text-xs bg-amber-600 px-2 py-0.5 rounded-full">Adisyon #{adisyon.id}</span>}
        </div>
        <div className="flex items-center gap-2">
          {adisyon && (
            <>
              <button onClick={() => setTasiModal(true)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-sm font-semibold transition">
                ↔ Taşı
              </button>
              <button onClick={() => setIptalOnay(true)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm font-semibold transition">
                ✕ İptal
              </button>
            </>
          )}
          <button onClick={masadanCik}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-semibold transition">
            ← Masalar
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sol: Adisyon */}
        <div className="md:w-1/2 p-3 sm:p-4 overflow-y-auto bg-white border-b md:border-b-0 md:border-r">
          {adisyon ? (
            <>
              <h3 className="font-bold text-gray-700 mb-3 text-sm sm:text-base">📋 Adisyon</h3>
              <div className="space-y-1 mb-3">
                {kalemler.length === 0 ? (
                  <p className="text-gray-400 text-sm">Henüz ürün eklenmedi</p>
                ) : kalemler.map((k) => (
                  <div key={k.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{k.urun_ad}</span>
                      <span className="text-gray-400 text-xs"> x{k.miktar}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{k.toplam} ₺</span>
                      {k.durum !== 'iptal' && (
                        <button onClick={() => kalemIptal(k.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mb-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam:</span><span className="text-amber-700">{adisyon.toplam} ₺</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => adisyonKapat('nakit')}
                  className="flex-1 bg-green-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-700 text-sm sm:text-base">💵 Nakit</button>
                <button onClick={() => adisyonKapat('kart')}
                  className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 text-sm sm:text-base">💳 Kart</button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-400 mb-4 text-sm">Bu masada açık adisyon yok</p>
              <button onClick={adisyonAc}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700">➕ Adisyon Aç</button>
            </div>
          )}
        </div>

        {/* Sağ: Menü */}
        <div className="md:w-1/2 p-3 sm:p-4 overflow-y-auto bg-gray-50">
          {adisyon ? (
            <>
              {/* Kategori filtre */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                <button onClick={() => setSeciliKategori('')}
                  className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${!seciliKategori ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'}`}>Tümü</button>
                {kategoriler.map((k) => (
                  <button key={k.id} onClick={() => setSeciliKategori(k.ad)}
                    className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${seciliKategori === k.ad ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'}`}>{k.ad}</button>
                ))}
              </div>
              {/* Ürünler */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filtreliUrunler.map((u) => (
                  <button key={u.id} onClick={() => urunEkle(u)}
                    className="p-3 sm:p-4 rounded-xl bg-white shadow-sm hover:shadow-md active:bg-amber-50 active:scale-95 transition text-left min-h-[52px]">
                    <div className="font-medium text-sm sm:text-base leading-tight">{u.ad}</div>
                    <div className="text-amber-600 font-bold text-sm sm:text-base mt-1">{u.fiyat} ₺</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Adisyon açınca menü görünür
            </div>
          )}
        </div>
      </div>

      {iptalOnay && adisyon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Adisyon İptal</h3>
            <p className="text-gray-600 mb-1">Adisyon #{adisyon.id} iptal edilecek.</p>
            <p className="text-sm text-gray-400 mb-6">Masadaki tüm ürünler silinecek, masa boşalacak.</p>
            <div className="flex gap-3">
              <button onClick={() => setIptalOnay(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
              <button onClick={adisyonIptal}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">İptal Et</button>
            </div>
          </div>
        </div>
      )}

      {tasiModal && adisyon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Adisyonu Taşı</h3>
            <p className="text-sm text-gray-500 mb-3">Boş bir masa seçin:</p>
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {masalar.filter(m => m.durum === 'bos' && m.id !== seciliMasa?.id).map((m) => (
                <button key={m.id} onClick={() => adisyonTasi(m.id)}
                  className="p-3 rounded-xl bg-gray-100 hover:bg-amber-100 text-sm font-semibold transition">
                  {m.ad || `Masa ${m.numara}`}
                </button>
              ))}
            </div>
            <button onClick={() => setTasiModal(false)}
              className="mt-4 w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-50">{mesaj}</div>}
    </div>
  )
}