import { useState, useEffect, useCallback } from 'react'
import { useStore, apiGet } from '../store'

interface AdisyonRapor {
  id: number
  garson_ad: string
  masa_numara: string
  toplam: string
  odeme_tipi: string
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
      <h1 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4 sm:mb-6">📋 Günün İşlemleri</h1>

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
              <tr key={a.id} className="border-b hover:bg-gray-50">
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
    </div>
  )
}