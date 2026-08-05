import { useState, useEffect } from 'react'
import { useStore, apiGet, apiPost, apiDelete } from '../store'

interface Masa {
  id: number
  numara: string
  ad: string | null
  kapasite: number
  durum: string
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

  const yukleMasalar = async () => {
    try {
      const data = await apiGet('/garson/masalar', token || undefined)
      setMasalar(data)
    } catch (e) { console.error(e) }
  }

  const yukleMenu = async () => {
    try {
      const [urunData, katData] = await Promise.all([
        apiGet('/garson/urunler', token || undefined),
        apiGet('/garson/kategoriler', token || undefined)
      ])
      setUrunler(urunData)
      setKategoriler(katData)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    yukleMasalar()
    yukleMenu()
  }, [])

  const masaSec = async (masa: Masa) => {
    setSeciliMasa(masa)
    try {
      const data = await apiGet(`/garson/masa/${masa.id}/adisyon`, token || undefined)
      setAdisyon(data.adisyon)
      setKalemler(data.kalemler || [])
    } catch (e) { console.error(e) }
  }

  const adisyonAc = async () => {
    if (!seciliMasa || !kullanici) return
    try {
      const data = await apiPost('/garson/adisyon/ac', {
        masaId: seciliMasa.id,
        garsonId: kullanici.id
      }, token || undefined)
      setAdisyon(data)
      yukleMasalar()
      setMesaj('Adisyon açıldı')
      setTimeout(() => setMesaj(''), 2000)
    } catch (e: any) {
      setMesaj(String(e.message || e))
      setTimeout(() => setMesaj(''), 3000)
    }
  }

  const urunEkle = async (urun: Urun) => {
    if (!adisyon) return
    try {
      await apiPost(`/garson/adisyon/${adisyon.id}/urun-ekle`, {
        urunId: urun.id,
        miktar: 1
      }, token || undefined)
      // Adisyonu yeniden yükle
      const data = await apiGet(`/garson/masa/${seciliMasa?.id}/adisyon`, token || undefined)
      setAdisyon(data.adisyon)
      setKalemler(data.kalemler || [])
    } catch (e) { console.error(e) }
  }

  const kalemIptal = async (kalemId: number) => {
    try {
      await apiDelete(`/garson/adisyon/kalem/${kalemId}`, token || undefined)
      const data = await apiGet(`/garson/masa/${seciliMasa?.id}/adisyon`, token || undefined)
      setAdisyon(data.adisyon)
      setKalemler(data.kalemler || [])
    } catch (e) { console.error(e) }
  }

  const adisyonKapat = async (odemeTipi: string) => {
    if (!adisyon) return
    try {
      await apiPost(`/garson/adisyon/${adisyon.id}/kapat`, { odemeTipi }, token || undefined)
      setAdisyon(null)
      setKalemler([])
      setSeciliMasa(null)
      yukleMasalar()
      setMesaj('Adisyon kapatıldı ✓')
      setTimeout(() => setMesaj(''), 3000)
    } catch (e: any) {
      setMesaj(String(e.message || e))
      setTimeout(() => setMesaj(''), 3000)
    }
  }

  const filtreliUrunler = seciliKategori
    ? urunler.filter(u => u.kategori_ad === seciliKategori)
    : urunler

  return (
    <div className="flex h-screen">
      {/* Masa Listesi */}
      <div className="w-1/3 p-4 overflow-y-auto bg-amber-50">
        <h2 className="text-xl font-bold text-amber-800 mb-4">🍽️ Masalar</h2>
        <div className="grid grid-cols-2 gap-3">
          {masalar.map((m) => (
            <button
              key={m.id}
              onClick={() => masaSec(m)}
              className={`p-4 rounded-xl text-center transition font-semibold ${
                seciliMasa?.id === m.id
                  ? 'bg-amber-600 text-white scale-105'
                  : m.durum === 'dolu'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-white text-gray-700 hover:bg-amber-100'
              }`}
            >
              <div className="text-lg">{m.ad || `Masa ${m.numara}`}</div>
              <div className="text-xs opacity-70">Kapasite: {m.kapasite}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Adisyon + Menu */}
      <div className="flex-1 flex">
        {/* Adisyon */}
        <div className="w-1/2 p-4 overflow-y-auto bg-white border-l">
          {seciliMasa ? (
            <>
              <h2 className="text-xl font-bold mb-4">
                {seciliMasa.ad || `Masa ${seciliMasa.numara}`}
              </h2>
              {adisyon ? (
                <>
                  <div className="space-y-2 mb-4">
                    {kalemler.map((k) => (
                      <div key={k.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                        <div>
                          <span className="font-medium">{k.urun_ad}</span>
                          <span className="text-sm text-gray-500"> x{k.miktar}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{k.toplam} ₺</span>
                          {k.durum !== 'iptal' && (
                            <button
                              onClick={() => kalemIptal(k.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Toplam:</span>
                      <span>{adisyon.toplam} ₺</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => adisyonKapat('nakit')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                    >
                      💵 Nakit
                    </button>
                    <button
                      onClick={() => adisyonKapat('kart')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      💳 Kart
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={adisyonAc}
                  className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700"
                >
                  ➕ Adisyon Aç
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Masa seçin</p>
            </div>
          )}
        </div>

        {/* Menü */}
        <div className="w-1/2 p-4 overflow-y-auto bg-gray-50 border-l">
          {adisyon && (
            <>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setSeciliKategori('')}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    !seciliKategori ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'
                  }`}
                >
                  Tümü
                </button>
                {kategoriler.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setSeciliKategori(k.ad)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      seciliKategori === k.ad ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'
                    }`}
                  >
                    {k.ad}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filtreliUrunler.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => urunEkle(u)}
                    className="p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition text-left"
                  >
                    <div className="font-medium text-sm">{u.ad}</div>
                    <div className="text-amber-600 font-bold">{u.fiyat} ₺</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {mesaj && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full">
          {mesaj}
        </div>
      )}
    </div>
  )
}