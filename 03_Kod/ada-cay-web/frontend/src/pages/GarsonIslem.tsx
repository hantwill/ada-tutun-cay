import { useState, useEffect, useCallback } from 'react'
import { useStore, apiGet } from '../store'

interface AdisyonRapor {
  id: number
  garson_ad: string
  masa_numara: string
  toplam: string
  odeme_tipi: string | null
  durum: string
  kapanis_tarih: string
}

interface GelirGider {
  id: number
  tip: string
  kategori: string | null
  miktar: string
  aciklama: string | null
  tarih: string
}

export default function GarsonIslem() {
  const { token } = useStore()
  const [adisyonlar, setAdisyonlar] = useState<AdisyonRapor[]>([])
  const [gelirGider, setGelirGider] = useState<GelirGider[]>([])
  const [loading, setLoading] = useState(true)
  const [adisyonDetay, setAdisyonDetay] = useState<any>(null)

  const yukle = useCallback(async () => {
    try {
      const [adis, gg] = await Promise.all([
        apiGet('/garson/rapor/adisyonlar', token || undefined),
        apiGet('/garson/rapor/gelir-gider', token || undefined)
      ])
      setAdisyonlar(adis)
      setGelirGider(gg)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [token])

  useEffect(() => { yukle() }, [yukle])

  const satisToplam = adisyonlar.reduce((s, a) => s + parseFloat(a.toplam), 0)
  const gelirToplam = gelirGider.filter(g => g.tip === 'gelir').reduce((s, g) => s + parseFloat(g.miktar), 0)
  const giderToplam = gelirGider.filter(g => g.tip === 'gider').reduce((s, g) => s + parseFloat(g.miktar), 0)

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Yükleniyor...</div>
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4 sm:mb-6"><span className="icon">📋</span> Günün İşlemleri</h1>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow text-center">
          <div className="text-xs text-gray-500">Satış</div>
          <div className="text-base sm:text-lg font-bold text-amber-700">{satisToplam.toFixed(2)} ₺</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow text-center">
          <div className="text-xs text-gray-500">Gelir</div>
          <div className="text-base sm:text-lg font-bold text-green-700">{gelirToplam.toFixed(2)} ₺</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow text-center">
          <div className="text-xs text-gray-500">Gider</div>
          <div className="text-base sm:text-lg font-bold text-red-700">{giderToplam.toFixed(2)} ₺</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow text-center">
          <div className="text-xs text-gray-500">Net Kasa</div>
          <div className="text-base sm:text-lg font-bold text-gray-800">{(satisToplam + gelirToplam - giderToplam).toFixed(2)} ₺</div>
        </div>
      </div>

      {/* Nakit/Kart adisyon breakdown */}
      <div className="bg-white rounded-xl shadow mb-4 sm:mb-6 overflow-x-auto">
        <h3 className="p-3 sm:p-4 font-semibold border-b">Ödeme Tipi Özeti</h3>
        <table className="w-full min-w-[400px]">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3">Tip</th>
            <th className="text-right p-3">Adet</th>
            <th className="text-right p-3">Toplam</th>
          </tr></thead>
          <tbody>
            {(() => {
              const nakit = adisyonlar.filter(a => a.odeme_tipi === 'nakit')
              const kart = adisyonlar.filter(a => a.odeme_tipi === 'kart')
              const nakitToplam = nakit.reduce((s, a) => s + parseFloat(a.toplam), 0)
              const kartToplam = kart.reduce((s, a) => s + parseFloat(a.toplam), 0)
              return (
                <>
                  <tr className="border-b">
                    <td className="p-3 font-medium">💵 Nakit Adisyon</td>
                    <td className="p-3 text-right">{nakit.length}</td>
                    <td className="p-3 text-right font-semibold text-amber-700">{nakitToplam.toFixed(2)} ₺</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">💳 Kart Adisyon</td>
                    <td className="p-3 text-right">{kart.length}</td>
                    <td className="p-3 text-right font-semibold text-amber-700">{kartToplam.toFixed(2)} ₺</td>
                  </tr>
                  <tr className="border-b bg-gray-50 font-bold">
                    <td className="p-3">Toplam (Kasa)</td>
                    <td className="p-3 text-right">{nakit.length + kart.length}</td>
                    <td className="p-3 text-right text-amber-700">{(nakitToplam + kartToplam).toFixed(2)} ₺</td>
                  </tr>
                </>
              )
            })()}
          </tbody>
        </table>
      </div>

      {/* Adisyonlar */}
      <div className="bg-white rounded-xl shadow mb-4 sm:mb-6 overflow-x-auto">
        <h3 className="p-3 sm:p-4 font-semibold border-b">Adisyonlar ({adisyonlar.length})</h3>
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3">#</th><th className="text-left p-3">Tarih</th>
            <th className="text-left p-3">Garson</th><th className="text-left p-3">Masa</th>
            <th className="text-left p-3">Tutar</th><th className="text-left p-3">Ödeme</th>
          </tr></thead>
          <tbody>
            {adisyonlar.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Kayıt yok</td></tr>
            ) : adisyonlar.map((a) => (
              <tr key={a.id} className="border-b hover:bg-amber-50 cursor-pointer" onClick={async () => {
                try {
                  const detay = await apiGet(`/garson/rapor/adisyon/${a.id}`, token || undefined)
                  setAdisyonDetay(detay)
                } catch (e) { console.error(e) }
              }}>
                <td className="p-3">#{a.id}</td>
                <td className="p-3 text-sm">{new Date(a.kapanis_tarih).toLocaleString('tr-TR')}</td>
                <td className="p-3">{a.garson_ad}</td>
                <td className="p-3">{a.masa_numara}</td>
                <td className="p-3 font-semibold text-amber-700">{a.toplam} ₺</td>
                <td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-gray-100">{a.odeme_tipi}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gelir/Gider */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <h3 className="p-3 sm:p-4 font-semibold border-b">Gelir/Gider ({gelirGider.length})</h3>
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3">Tip</th><th className="text-left p-3">Kategori</th>
            <th className="text-left p-3">Açıklama</th><th className="text-left p-3">Miktar</th>
            <th className="text-left p-3">Tarih</th>
          </tr></thead>
          <tbody>
            {gelirGider.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Kayıt yok</td></tr>
            ) : gelirGider.map((g) => (
              <tr key={g.id} className="border-b hover:bg-gray-50">
                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${g.tip === 'gelir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{g.tip}</span></td>
                <td className="p-3">{g.kategori || '-'}</td>
                <td className="p-3">{g.aciklama || '-'}</td>
                <td className={`p-3 font-semibold ${g.tip === 'gelir' ? 'text-green-700' : 'text-red-700'}`}>{g.miktar} ₺</td>
                <td className="p-3 text-sm text-gray-500">{new Date(g.tarih).toLocaleString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adisyonDetay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setAdisyonDetay(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Adisyon #{adisyonDetay.adisyon.id}</h3>
                <p className="text-sm text-gray-500">{adisyonDetay.adisyon.masa_ad || `Masa ${adisyonDetay.adisyon.masa_numara}`}</p>
              </div>
              <button onClick={() => setAdisyonDetay(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Garson</div>
                <div className="font-semibold text-sm">{adisyonDetay.adisyon.garson_ad}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Ödeme</div>
                <div className="font-semibold text-sm">{adisyonDetay.adisyon.odeme_tipi || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Açılış</div>
                <div className="font-semibold text-sm">{new Date(adisyonDetay.adisyon.acilis_tarih).toLocaleString('tr-TR')}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Kapanış</div>
                <div className="font-semibold text-sm">{adisyonDetay.adisyon.kapanis_tarih ? new Date(adisyonDetay.adisyon.kapanis_tarih).toLocaleString('tr-TR') : '-'}</div>
              </div>
            </div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Kalemler</h4>
            <div className="space-y-1 mb-4">
              {adisyonDetay.kalemler.length === 0 ? (
                <p className="text-gray-400 text-sm">Ürün yok</p>
              ) : adisyonDetay.kalemler.map((k: any) => (
                <div key={k.id} className={`flex justify-between items-center p-2 rounded-lg text-sm ${k.durum === 'iptal' ? 'bg-red-50 text-gray-400 line-through' : 'bg-gray-50'}`}>
                  <div className="flex-1">
                    <span className="font-medium">{k.urun_ad}</span>
                    <span className="text-gray-400 text-xs"> x{k.miktar}</span>
                    {k.durum === 'iptal' && <span className="text-xs text-red-500 ml-2">(iptal)</span>}
                  </div>
                  <span className="font-semibold">{k.toplam} ₺</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Toplam:</span><span className="text-amber-700">{adisyonDetay.adisyon.toplam} ₺</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}