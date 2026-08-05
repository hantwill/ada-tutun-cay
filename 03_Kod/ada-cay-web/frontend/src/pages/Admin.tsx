import { useState, useEffect } from 'react'
import { useStore, apiGet, apiPost, apiPut, apiDelete } from '../store'

interface DashboardData {
  bugun_satis: number
  bugun_adet: number
  aktif_adisyon: number
  dolu_masa: number
  toplam_masa: number
  bugun_gelir: number
  bugun_gider: number
}

interface Garson {
  id: number
  telefon: string
  ad: string
  rol: string
  aktif: boolean
}

export default function Admin() {
  const { token, sayfa } = useStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [garsonlar, setGarsonlar] = useState<Garson[]>([])
  const [yeniGarson, setYeniGarson] = useState({ telefon: '', ad: '', sifre: '', rol: 'garson' })
  const [mesaj, setMesaj] = useState('')

  const yukle = async () => {
    try {
      const [dash, gar] = await Promise.all([
        apiGet('/admin/dashboard', token || undefined),
        apiGet('/admin/garsonlar', token || undefined)
      ])
      setData(dash)
      setGarsonlar(gar)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { yukle() }, [])

  const garsonEkle = async () => {
    try {
      await apiPost('/admin/garsonlar', yeniGarson, token || undefined)
      setYeniGarson({ telefon: '', ad: '', sifre: '', rol: 'garson' })
      setMesaj('Garson eklendi ✓')
      setTimeout(() => setMesaj(''), 2000)
      yukle()
    } catch (e: any) {
      setMesaj(String(e.message || e))
      setTimeout(() => setMesaj(''), 3000)
    }
  }

  const garsonSil = async (id: number) => {
    if (!confirm('Bu garsonu sil?')) return
    try {
      await apiDelete(`/admin/garsonlar/${id}`, token || undefined)
      yukle()
    } catch (e: any) {
      setMesaj(String(e.message || e))
      setTimeout(() => setMesaj(''), 3000)
    }
  }

  const garsonGuncelle = async (id: number, aktif: boolean) => {
    const g = garsonlar.find(x => x.id === id)
    if (!g) return
    try {
      await apiPut(`/admin/garsonlar/${id}`, { ad: g.ad, rol: g.rol, aktif: !aktif }, token || undefined)
      yukle()
    } catch (e) { console.error(e) }
  }

  if (sayfa === 'dashboard') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">📊 Dashboard</h1>
        {data && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sm text-gray-500">Bugün Satış</div>
              <div className="text-2xl font-bold text-amber-700">{data.bugun_satis.toFixed(2)} ₺</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sm text-gray-500">Bugün Adisyon</div>
              <div className="text-2xl font-bold text-blue-700">{data.bugun_adet}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sm text-gray-500">Aktif Adisyon</div>
              <div className="text-2xl font-bold text-green-700">{data.aktif_adisyon}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sm text-gray-500">Dolu Masa</div>
              <div className="text-2xl font-bold text-orange-700">{data.dolu_masa}/{data.toplam_masa}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sm text-gray-500">Bugün Gelir</div>
              <div className="text-2xl font-bold text-green-700">{data.bugun_gelir.toFixed(2)} ₺</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sm text-gray-500">Bugün Gider</div>
              <div className="text-2xl font-bold text-red-700">{data.bugun_gider.toFixed(2)} ₺</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sm text-gray-500">Net</div>
              <div className="text-2xl font-bold text-gray-800">{(data.bugun_gelir - data.bugun_gider).toFixed(2)} ₺</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (sayfa === 'garsonlar') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">👥 Garson Yönetimi</h1>
        <div className="bg-white rounded-xl p-6 shadow mb-6">
          <h2 className="font-semibold mb-4">Yeni Garson Ekle</h2>
          <div className="grid grid-cols-4 gap-3">
            <input
              type="tel"
              placeholder="Telefon"
              value={yeniGarson.telefon}
              onChange={(e) => setYeniGarson({ ...yeniGarson, telefon: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              placeholder="Ad"
              value={yeniGarson.ad}
              onChange={(e) => setYeniGarson({ ...yeniGarson, ad: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="password"
              placeholder="Şifre"
              value={yeniGarson.sifre}
              onChange={(e) => setYeniGarson({ ...yeniGarson, sifre: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={garsonEkle}
              className="bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700"
            >
              Ekle
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Telefon</th>
                <th className="text-left p-3">Ad</th>
                <th className="text-left p-3">Rol</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-left p-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {garsonlar.map((g) => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">#{g.id}</td>
                  <td className="p-3">{g.telefon}</td>
                  <td className="p-3">{g.ad}</td>
                  <td className="p-3">{g.rol}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${g.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {g.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => garsonGuncelle(g.id, g.aktif)}
                      className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      {g.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                    <button
                      onClick={() => garsonSil(g.id)}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mesaj && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full">
            {mesaj}
          </div>
        )}
      </div>
    )
  }

  return null
}