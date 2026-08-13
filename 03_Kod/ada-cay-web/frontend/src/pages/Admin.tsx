import { useState, useEffect, useCallback } from 'react'
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
  kullanici_ad: string
  ad: string
  rol: string
  aktif: boolean
}

interface Urun {
  id: number
  ad: string
  kategori_id: number | null
  kategori_ad: string | null
  fiyat: string
  aktif: boolean
}

interface Kategori {
  id: number
  ad: string
}

interface Masa {
  id: number
  numara: string
  ad: string | null
  kapasite: number
  durum: string
}

interface GelirGider {
  id: number
  tip: string
  kategori: string | null
  miktar: string
  aciklama: string | null
  tarih: string
}

interface AdisyonRapor {
  id: number
  garson_ad: string
  masa_numara: string
  toplam: string
  odeme_tipi: string
  durum: string
  kapanis_tarih: string
}

function bugunISO() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export default function Admin() {
  const { token, sayfa } = useStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [garsonlar, setGarsonlar] = useState<Garson[]>([])
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [kategoriler, setKategoriler] = useState<Kategori[]>([])
  const [masalar, setMasalar] = useState<Masa[]>([])
  const [yeniMasa, setYeniMasa] = useState({ numara: '', ad: '', kapasite: '4' })
  const [editMasa, setEditMasa] = useState<Masa | null>(null)
  const [gelirGiderList, setGelirGiderList] = useState<GelirGider[]>([])
  const [raporAdisyonlar, setRaporAdisyonlar] = useState<AdisyonRapor[]>([])
  const [raporGelirGider, setRaporGelirGider] = useState<GelirGider[]>([])
  const [yeniGarson, setYeniGarson] = useState({ kullanici_ad: '', ad: '', sifre: '', rol: 'garson' })
  const [yeniUrun, setYeniUrun] = useState({ ad: '', kategori_id: '', fiyat: '' })
  const [yeniKayit, setYeniKayit] = useState({ tip: 'gelir', kategori: '', miktar: '', aciklama: '' })
  const [raporBaslangic, setRaporBaslangic] = useState(bugunISO())
  const [raporBitis, setRaporBitis] = useState(bugunISO())
  const [mesaj, setMesaj] = useState('')
  const [silOnay, setSilOnay] = useState<{ id: number; ad: string; tip: string } | null>(null)
  const [editUrun, setEditUrun] = useState<Urun | null>(null)
  const [adisyonDetay, setAdisyonDetay] = useState<any>(null)

  const mesajGoster = (m: string) => { setMesaj(m); setTimeout(() => setMesaj(''), 2500) }

  const yukle = useCallback(async () => {
    try {
      const [dash, gar] = await Promise.all([
        apiGet('/admin/dashboard', token || undefined),
        apiGet('/admin/garsonlar', token || undefined)
      ])
      setData(dash)
      setGarsonlar(gar)
    } catch (e) { console.error(e) }
  }, [token])

  const yukleUrunler = useCallback(async () => {
    try {
      const [urunData, katData] = await Promise.all([
        apiGet('/garson/urunler', token || undefined),
        apiGet('/garson/kategoriler', token || undefined)
      ])
      setUrunler(urunData)
      setKategoriler(katData)
    } catch (e) { console.error(e) }
  }, [token])

  const yukleMasalar = useCallback(async () => {
    try {
      const data = await apiGet('/garson/masalar', token || undefined)
      setMasalar(data)
    } catch (e) { console.error(e) }
  }, [token])

  const yukleGelirGider = useCallback(async () => {
    try {
      const b = bugunISO()
      const data = await apiGet(`/admin/rapor?baslangic=${b}&bitis=${b}`, token || undefined)
      setGelirGiderList(data.gelir_gider || [])
    } catch (e) { console.error(e) }
  }, [token])

  const yukleRapor = useCallback(async () => {
    try {
      const data = await apiGet(`/admin/rapor?baslangic=${raporBaslangic}&bitis=${raporBitis}`, token || undefined)
      setRaporAdisyonlar(data.adisyonlar || [])
      setRaporGelirGider(data.gelir_gider || [])
    } catch (e) { console.error(e) }
  }, [token, raporBaslangic, raporBitis])

  useEffect(() => { yukle() }, [yukle])
  useEffect(() => { if (sayfa === 'urunler') yukleUrunler() }, [sayfa, yukleUrunler])
  useEffect(() => { if (sayfa === 'masalar') yukleMasalar() }, [sayfa, yukleMasalar])
  useEffect(() => { if (sayfa === 'gelir-gider') yukleGelirGider() }, [sayfa, yukleGelirGider])
  useEffect(() => { if (sayfa === 'raporlar') yukleRapor() }, [sayfa, yukleRapor])

  const indirCSV = async () => {
    const API = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${API}/api/admin/rapor/csv?baslangic=${raporBaslangic}&bitis=${raporBitis}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) { mesajGoster('CSV indirilemedi'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapor_${raporBaslangic}_${raporBitis}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // === DASHBOARD ===
  if (sayfa === 'dashboard') {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4 sm:mb-6">📊 Dashboard</h1>
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Bugün Satış', val: `${Number(data.bugun_satis).toFixed(2)} ₺`, color: 'text-amber-700' },
              { label: 'Adisyon', val: data.bugun_adet, color: 'text-blue-700' },
              { label: 'Aktif', val: data.aktif_adisyon, color: 'text-green-700' },
              { label: 'Dolu Masa', val: `${data.dolu_masa}/${data.toplam_masa}`, color: 'text-orange-700' },
              { label: 'Ek Gelir', val: `${Number(data.bugun_gelir).toFixed(2)} ₺`, color: 'text-green-700' },
              { label: 'Gider', val: `${Number(data.bugun_gider).toFixed(2)} ₺`, color: 'text-red-700' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-4 sm:p-6 shadow">
                <div className="text-xs sm:text-sm text-gray-500">{c.label}</div>
                <div className={`text-lg sm:text-2xl font-bold ${c.color}`}>{c.val}</div>
              </div>
            ))}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow col-span-2">
              <div className="text-xs sm:text-sm text-gray-500">Net Kasa</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{(Number(data.bugun_satis) + Number(data.bugun_gelir) - Number(data.bugun_gider)).toFixed(2)} ₺</div>
              <div className="text-xs text-gray-400 mt-1">Satış + Ek Gelir - Gider</div>
            </div>
          </div>
        )}
        {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-sm z-50">{mesaj}</div>}
      </div>
    )
  }

  // === KULLANICI YÖNETİMİ ===
  if (sayfa === 'garsonlar') {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4 sm:mb-6">👥 Kullanıcılar</h1>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow mb-4 sm:mb-6">
          <h2 className="font-semibold mb-4">Yeni Kullanıcı</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="text" placeholder="Kullanıcı Adı" value={yeniGarson.kullanici_ad}
              onChange={(e) => setYeniGarson({ ...yeniGarson, kullanici_ad: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <input type="text" placeholder="Ad Soyad" value={yeniGarson.ad}
              onChange={(e) => setYeniGarson({ ...yeniGarson, ad: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <input type="password" placeholder="Şifre" value={yeniGarson.sifre}
              onChange={(e) => setYeniGarson({ ...yeniGarson, sifre: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <div className="flex gap-2">
              <select value={yeniGarson.rol} onChange={(e) => setYeniGarson({ ...yeniGarson, rol: e.target.value })}
                className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 flex-1">
                <option value="garson">Garson</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={async () => {
                try { await apiPost('/admin/garsonlar', yeniGarson, token || undefined)
                  setYeniGarson({ kullanici_ad: '', ad: '', sifre: '', rol: 'garson' }); mesajGoster('Eklendi ✓'); yukle()
                } catch (e: any) { mesajGoster(String(e.message || e)) }
              }} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700 whitespace-nowrap">Ekle</button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-100"><tr>
              <th className="text-left p-3">ID</th><th className="text-left p-3">Kullanıcı</th>
              <th className="text-left p-3">Ad</th><th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Durum</th><th className="text-left p-3">İşlem</th>
            </tr></thead>
            <tbody>
              {garsonlar.map((g) => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">#{g.id}</td><td className="p-3">{g.kullanici_ad}</td>
                  <td className="p-3">{g.ad}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${g.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{g.rol}</span></td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${g.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{g.aktif ? 'Aktif' : 'Pasif'}</span></td>
                  <td className="p-3 flex gap-1">
                    <button onClick={async () => {
                      const { apiPut } = await import('../store')
                      try { await apiPut(`/admin/garsonlar/${g.id}`, { ad: g.ad, rol: g.rol, aktif: !g.aktif }, token || undefined); yukle()
                      } catch (e: any) { mesajGoster(String(e.message || e)) }
                    }} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">{g.aktif ? 'Pasif' : 'Aktif'}</button>
                    <button onClick={() => setSilOnay({ id: g.id, ad: g.ad, tip: 'garson' })}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-sm z-50">{mesaj}</div>}
        {silOnay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Silme Onayı</h3>
              <p className="text-gray-600 mb-1">"<span className="font-semibold">{silOnay.ad}</span>" silinecek.</p>
              <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnay(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
                <button onClick={async () => {
                  try {
                    if (silOnay.tip === 'urun') {
                      await apiDelete(`/admin/urunler/${silOnay.id}`, token || undefined)
                      mesajGoster('Ürün silindi'); yukleUrunler()
                    } else if (silOnay.tip === 'garson') {
                      await apiDelete(`/admin/garsonlar/${silOnay.id}`, token || undefined)
                      mesajGoster('Kullanıcı silindi'); yukle()
                    } else if (silOnay.tip === 'masa') {
                      await apiDelete(`/admin/masalar/${silOnay.id}`, token || undefined)
                      mesajGoster('Masa silindi'); yukleMasalar()
                    } else if (silOnay.tip === 'gelir-gider') {
                      await apiDelete(`/admin/gelir-gider/${silOnay.id}`, token || undefined)
                      mesajGoster('Kayıt silindi'); yukleGelirGider()
                    }
                  } catch (e: any) { mesajGoster(String(e.message || e)) }
                  setSilOnay(null)
                }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Sil</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // === MASA YÖNETİMİ ===
  if (sayfa === 'masalar') {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4 sm:mb-6">🪑 Masalar</h1>

        {/* Yeni masa ekleme */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow mb-4 sm:mb-6">
          <h2 className="font-semibold mb-4">Yeni Masa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="text" placeholder="Masa No (örn: 1)" value={yeniMasa.numara}
              onChange={(e) => setYeniMasa({ ...yeniMasa, numara: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <input type="text" placeholder="Masa Adı (örn: Pencere Kenarı)" value={yeniMasa.ad}
              onChange={(e) => setYeniMasa({ ...yeniMasa, ad: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <input type="number" placeholder="Kapasite" value={yeniMasa.kapasite}
              onChange={(e) => setYeniMasa({ ...yeniMasa, kapasite: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <button onClick={async () => {
              if (!yeniMasa.numara) { mesajGoster('Masa numarası gerekli'); return }
              try {
                await apiPost('/admin/masalar', { numara: yeniMasa.numara, ad: yeniMasa.ad || null, kapasite: parseInt(yeniMasa.kapasite) || 4 }, token || undefined)
                setYeniMasa({ numara: '', ad: '', kapasite: '4' }); mesajGoster('Masa eklendi ✓'); yukleMasalar()
              } catch (e: any) { mesajGoster(String(e.message || e)) }
            }} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700">Ekle</button>
          </div>
        </div>

        {/* Masa listesi — düzenle + sil */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-100"><tr>
              <th className="text-left p-3">No</th><th className="text-left p-3">Ad</th>
              <th className="text-left p-3">Kapasite</th><th className="text-left p-3">Durum</th>
              <th className="text-left p-3">İşlem</th>
            </tr></thead>
            <tbody>
              {masalar.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-400">Masa yok</td></tr>
              ) : masalar.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{m.numara}</td>
                  <td className="p-3">{m.ad || '-'}</td>
                  <td className="p-3">{m.kapasite} kişi</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${m.durum === 'bos' ? 'bg-green-100 text-green-700' : m.durum === 'dolu' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{m.durum === 'bos' ? 'Boş' : m.durum === 'dolu' ? 'Dolu' : 'Rezerve'}</span></td>
                  <td className="p-3 flex gap-1">
                    <button onClick={() => setEditMasa(m)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Düzenle</button>
                    <button onClick={() => setSilOnay({ id: m.id, ad: `Masa ${m.numara}${m.ad ? ' (${m.ad})' : ''}`, tip: 'masa' })}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-sm z-50">{mesaj}</div>}
        {silOnay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Silme Onayı</h3>
              <p className="text-gray-600 mb-1">"<span className="font-semibold">{silOnay.ad}</span>" silinecek.</p>
              <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnay(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
                <button onClick={async () => {
                  try {
                    if (silOnay.tip === 'masa') {
                      await apiDelete(`/admin/masalar/${silOnay.id}`, token || undefined)
                      mesajGoster('Masa silindi'); yukleMasalar()
                    }
                  } catch (e: any) { mesajGoster(String(e.message || e)) }
                  setSilOnay(null)
                }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Sil</button>
              </div>
            </div>
          </div>
        )}
        {editMasa && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Masa Düzenle</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Masa Numarası</label>
                  <input type="text" value={editMasa.numara}
                    onChange={(e) => setEditMasa({ ...editMasa, numara: e.target.value })}
                    className="block w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Masa Adı</label>
                  <input type="text" value={editMasa.ad ?? ''}
                    onChange={(e) => setEditMasa({ ...editMasa, ad: e.target.value })}
                    placeholder="(opsiyonel)"
                    className="block w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Kapasite</label>
                  <input type="number" value={editMasa.kapasite}
                    onChange={(e) => setEditMasa({ ...editMasa, kapasite: parseInt(e.target.value) || 4 })}
                    className="block w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditMasa(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
                <button onClick={async () => {
                  if (!editMasa) return
                  try {
                    await apiPut(`/admin/masalar/${editMasa.id}`, {
                      numara: editMasa.numara,
                      ad: editMasa.ad || null,
                      kapasite: editMasa.kapasite
                    }, token || undefined)
                    mesajGoster('Düzenlendi ✓'); setEditMasa(null); yukleMasalar()
                  } catch (e: any) { mesajGoster(String(e.message || e)) }
                }}
                  className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700">Kaydet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  if (sayfa === 'urunler') {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4 sm:mb-6">🍽️ Ürünler</h1>

        {/* Yeni ürün ekleme */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow mb-4 sm:mb-6">
          <h2 className="font-semibold mb-4">Yeni Ürün</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="text" placeholder="Ürün Adı" value={yeniUrun.ad}
              onChange={(e) => setYeniUrun({ ...yeniUrun, ad: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <select value={yeniUrun.kategori_id}
              onChange={(e) => setYeniUrun({ ...yeniUrun, kategori_id: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Kategori Seç</option>
              {kategoriler.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Fiyat (₺)" value={yeniUrun.fiyat}
              onChange={(e) => setYeniUrun({ ...yeniUrun, fiyat: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <button onClick={async () => {
              if (!yeniUrun.ad || !yeniUrun.fiyat) { mesajGoster('Ad ve fiyat gerekli'); return }
              try { const { apiPost } = await import('../store')
                await apiPost('/admin/urunler', { ad: yeniUrun.ad, kategoriId: yeniUrun.kategori_id ? parseInt(yeniUrun.kategori_id) : null, fiyat: parseFloat(yeniUrun.fiyat) }, token || undefined)
                setYeniUrun({ ad: '', kategori_id: '', fiyat: '' }); mesajGoster('Ürün eklendi ✓'); yukleUrunler()
              } catch (e: any) { mesajGoster(String(e.message || e)) }
            }} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700">Ekle</button>
          </div>
        </div>

        {/* Ürün listesi — düzenle + sil */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-100"><tr>
              <th className="text-left p-3">Ürün</th><th className="text-left p-3">Kategori</th>
              <th className="text-left p-3">Fiyat</th><th className="text-left p-3">İşlem</th>
            </tr></thead>
            <tbody>
              {urunler.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.ad}</td>
                  <td className="p-3">{u.kategori_ad || '-'}</td>
                  <td className="p-3 font-semibold text-amber-700">{u.fiyat} ₺</td>
                  <td className="p-3 flex gap-1">
                    <button onClick={() => setEditUrun(u)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Düzenle</button>
                    <button onClick={() => setSilOnay({ id: u.id, ad: u.ad, tip: 'urun' })}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-sm z-50">{mesaj}</div>}
        {silOnay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Silme Onayı</h3>
              <p className="text-gray-600 mb-1">"<span className="font-semibold">{silOnay.ad}</span>" silinecek.</p>
              <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnay(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
                <button onClick={async () => {
                  try {
                    if (silOnay.tip === 'urun') {
                      await apiDelete(`/admin/urunler/${silOnay.id}`, token || undefined)
                      mesajGoster('Ürün silindi'); yukleUrunler()
                    } else if (silOnay.tip === 'garson') {
                      await apiDelete(`/admin/garsonlar/${silOnay.id}`, token || undefined)
                      mesajGoster('Kullanıcı silindi'); yukle()
                    } else if (silOnay.tip === 'masa') {
                      await apiDelete(`/admin/masalar/${silOnay.id}`, token || undefined)
                      mesajGoster('Masa silindi'); yukleMasalar()
                    } else if (silOnay.tip === 'gelir-gider') {
                      await apiDelete(`/admin/gelir-gider/${silOnay.id}`, token || undefined)
                      mesajGoster('Kayıt silindi'); yukleGelirGider()
                    }
                  } catch (e: any) { mesajGoster(String(e.message || e)) }
                  setSilOnay(null)
                }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Sil</button>
              </div>
            </div>
          </div>
        )}
        {editUrun && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Ürün Düzenle</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Ürün Adı</label>
                  <input type="text" value={editUrun.ad}
                    onChange={(e) => setEditUrun({ ...editUrun, ad: e.target.value })}
                    className="block w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Kategori</label>
                  <select value={editUrun.kategori_id ?? ''}
                    onChange={(e) => setEditUrun({ ...editUrun, kategori_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="block w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">Kategori Seç</option>
                    {kategoriler.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Fiyat (₺)</label>
                  <input type="number" step="0.01" value={editUrun.fiyat}
                    onChange={(e) => setEditUrun({ ...editUrun, fiyat: e.target.value })}
                    className="block w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditUrun(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
                <button onClick={async () => {
                  if (!editUrun) return
                  try {
                    await apiPut(`/admin/urunler/${editUrun.id}`, {
                      ad: editUrun.ad,
                      kategoriId: editUrun.kategori_id ?? null,
                      fiyat: parseFloat(editUrun.fiyat) || 0,
                      aktif: editUrun.aktif
                    }, token || undefined)
                    mesajGoster('Düzenlendi ✓'); setEditUrun(null); yukleUrunler()
                  } catch (e: any) { mesajGoster(String(e.message || e)) }
                }}
                  className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700">Kaydet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // === GELİR / GİDER ===
  if (sayfa === 'gelir-gider') {
    const gelirToplam = gelirGiderList.filter(g => g.tip === 'gelir').reduce((s, g) => s + parseFloat(g.miktar), 0)
    const giderToplam = gelirGiderList.filter(g => g.tip === 'gider').reduce((s, g) => s + parseFloat(g.miktar), 0)
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4 sm:mb-6">💰 Gelir / Gider</h1>

        {/* Ekleme formu */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow mb-4 sm:mb-6">
          <h2 className="font-semibold mb-4">Yeni Kayıt Ekle</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <select value={yeniKayit.tip} onChange={(e) => setYeniKayit({ ...yeniKayit, tip: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500">
              <option value="gelir">Gelir</option>
              <option value="gider">Gider</option>
            </select>
            <input type="text" placeholder="Kategori" value={yeniKayit.kategori}
              onChange={(e) => setYeniKayit({ ...yeniKayit, kategori: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <input type="number" step="0.01" placeholder="Miktar (₺)" value={yeniKayit.miktar}
              onChange={(e) => setYeniKayit({ ...yeniKayit, miktar: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <input type="text" placeholder="Açıklama" value={yeniKayit.aciklama}
              onChange={(e) => setYeniKayit({ ...yeniKayit, aciklama: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            <button onClick={async () => {
              if (!yeniKayit.miktar) { mesajGoster('Miktar gerekli'); return }
              try { await apiPost('/admin/gelir-gider', { tip: yeniKayit.tip, kategori: yeniKayit.kategori || null, miktar: parseFloat(yeniKayit.miktar), aciklama: yeniKayit.aciklama || null }, token || undefined)
                setYeniKayit({ tip: 'gelir', kategori: '', miktar: '', aciklama: '' }); mesajGoster('Eklendi ✓'); yukleGelirGider()
              } catch (e: any) { mesajGoster(String(e.message || e)) }
            }} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700">Ekle</button>
          </div>
        </div>

        {/* Özet kartları */}
        <div className="grid grid-cols-3 gap-3 mb-4 sm:mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-xs text-green-600">Gelir</div>
            <div className="text-lg sm:text-xl font-bold text-green-700">{gelirToplam.toFixed(2)} ₺</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-xs text-red-600">Gider</div>
            <div className="text-lg sm:text-xl font-bold text-red-700">{giderToplam.toFixed(2)} ₺</div>
          </div>
          <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-xs text-gray-500">Net</div>
            <div className="text-lg sm:text-xl font-bold text-gray-800">{(gelirToplam - giderToplam).toFixed(2)} ₺</div>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-100"><tr>
              <th className="text-left p-3">Tip</th><th className="text-left p-3">Kategori</th>
              <th className="text-left p-3">Açıklama</th><th className="text-left p-3">Miktar</th>
              <th className="text-left p-3">Tarih</th><th className="text-left p-3">İşlem</th>
            </tr></thead>
            <tbody>
              {gelirGiderList.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">Bugün kayıt yok</td></tr>
              ) : gelirGiderList.map((g) => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${g.tip === 'gelir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{g.tip}</span></td>
                  <td className="p-3">{g.kategori || '-'}</td>
                  <td className="p-3">{g.aciklama || '-'}</td>
                  <td className={`p-3 font-semibold ${g.tip === 'gelir' ? 'text-green-700' : 'text-red-700'}`}>{g.miktar} ₺</td>
                  <td className="p-3 text-sm text-gray-500">{new Date(g.tarih).toLocaleString('tr-TR')}</td>
                  <td className="p-3">
                    <button onClick={() => setSilOnay({ id: g.id, ad: g.aciklama || g.kategori || 'kayıt', tip: 'gelir-gider' })}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Sil</button>
                  </td>
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

        {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-sm z-50">{mesaj}</div>}
        {silOnay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Silme Onayı</h3>
              <p className="text-gray-600 mb-1">"<span className="font-semibold">{silOnay.ad}</span>" silinecek.</p>
              <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnay(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
                <button onClick={async () => {
                  try {
                    if (silOnay.tip === 'urun') {
                      await apiDelete(`/admin/urunler/${silOnay.id}`, token || undefined)
                      mesajGoster('Ürün silindi'); yukleUrunler()
                    } else if (silOnay.tip === 'garson') {
                      await apiDelete(`/admin/garsonlar/${silOnay.id}`, token || undefined)
                      mesajGoster('Kullanıcı silindi'); yukle()
                    } else if (silOnay.tip === 'masa') {
                      await apiDelete(`/admin/masalar/${silOnay.id}`, token || undefined)
                      mesajGoster('Masa silindi'); yukleMasalar()
                    } else if (silOnay.tip === 'gelir-gider') {
                      await apiDelete(`/admin/gelir-gider/${silOnay.id}`, token || undefined)
                      mesajGoster('Kayıt silindi'); yukleGelirGider()
                    }
                  } catch (e: any) { mesajGoster(String(e.message || e)) }
                  setSilOnay(null)
                }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Sil</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // === RAPORLAR ===
  if (sayfa === 'raporlar') {
    const satisToplam = raporAdisyonlar.reduce((s, a) => s + parseFloat(a.toplam), 0)
    const gelirToplam = raporGelirGider.filter(g => g.tip === 'gelir').reduce((s, g) => s + parseFloat(g.miktar), 0)
    const giderToplam = raporGelirGider.filter(g => g.tip === 'gider').reduce((s, g) => s + parseFloat(g.miktar), 0)
    const net = satisToplam + gelirToplam - giderToplam

    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4 sm:mb-6">📋 Raporlar</h1>

        {/* Tarih aralığı + Excel */}
        <div className="bg-white rounded-xl p-4 shadow mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div>
              <label className="text-xs text-gray-500">Başlangıç</label>
              <input type="date" value={raporBaslangic} onChange={(e) => setRaporBaslangic(e.target.value)}
                className="block px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Bitiş</label>
              <input type="date" value={raporBitis} onChange={(e) => setRaporBitis(e.target.value)}
                className="block px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={yukleRapor}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700 whitespace-nowrap">Getir</button>
              <button onClick={indirCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 whitespace-nowrap">📊 Excel</button>
            </div>
          </div>
        </div>

        {/* Özet */}
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
            <div className="text-xs text-gray-500">Net</div>
            <div className="text-base sm:text-lg font-bold text-gray-800">{net.toFixed(2)} ₺</div>
          </div>
        </div>

        {/* Adisyonlar */}
        <div className="bg-white rounded-xl shadow mb-4 sm:mb-6 overflow-x-auto">
          <h3 className="p-3 sm:p-4 font-semibold border-b">Adisyonlar ({raporAdisyonlar.length})</h3>
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50"><tr>
              <th className="text-left p-3">#</th><th className="text-left p-3">Tarih</th>
              <th className="text-left p-3">Garson</th><th className="text-left p-3">Masa</th>
              <th className="text-left p-3">Tutar</th><th className="text-left p-3">Ödeme</th>
            </tr></thead>
            <tbody>
              {raporAdisyonlar.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">Kayıt yok</td></tr>
              ) : raporAdisyonlar.map((a) => (
                <tr key={a.id} className="border-b hover:bg-amber-50 cursor-pointer" onClick={async () => {
                  try {
                    const detay = await apiGet(`/admin/rapor/adisyon/${a.id}`, token || undefined)
                    setAdisyonDetay(detay)
                  } catch (e: any) { mesajGoster(String(e.message || e)) }
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
          <h3 className="p-3 sm:p-4 font-semibold border-b">Gelir/Gider ({raporGelirGider.length})</h3>
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50"><tr>
              <th className="text-left p-3">Tip</th><th className="text-left p-3">Kategori</th>
              <th className="text-left p-3">Açıklama</th><th className="text-left p-3">Miktar</th>
              <th className="text-left p-3">Tarih</th>
            </tr></thead>
            <tbody>
              {raporGelirGider.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-400">Kayıt yok</td></tr>
              ) : raporGelirGider.map((g) => (
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
        {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-sm z-50">{mesaj}</div>}
        {silOnay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Silme Onayı</h3>
              <p className="text-gray-600 mb-1">"<span className="font-semibold">{silOnay.ad}</span>" silinecek.</p>
              <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnay(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
                <button onClick={async () => {
                  try {
                    if (silOnay.tip === 'urun') {
                      await apiDelete(`/admin/urunler/${silOnay.id}`, token || undefined)
                      mesajGoster('Ürün silindi'); yukleUrunler()
                    } else if (silOnay.tip === 'garson') {
                      await apiDelete(`/admin/garsonlar/${silOnay.id}`, token || undefined)
                      mesajGoster('Kullanıcı silindi'); yukle()
                    } else if (silOnay.tip === 'masa') {
                      await apiDelete(`/admin/masalar/${silOnay.id}`, token || undefined)
                      mesajGoster('Masa silindi'); yukleMasalar()
                    } else if (silOnay.tip === 'gelir-gider') {
                      await apiDelete(`/admin/gelir-gider/${silOnay.id}`, token || undefined)
                      mesajGoster('Kayıt silindi'); yukleGelirGider()
                    }
                  } catch (e: any) { mesajGoster(String(e.message || e)) }
                  setSilOnay(null)
                }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Sil</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {silOnay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Silme Onayı</h3>
            <p className="text-gray-600 mb-1">"<span className="font-semibold">{silOnay.ad}</span>" silinecek.</p>
            <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz.</p>
            <div className="flex gap-3">
              <button onClick={() => setSilOnay(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Vazgeç</button>
              <button onClick={async () => {
                try {
                  if (silOnay.tip === 'urun') {
                    await apiDelete(`/admin/urunler/${silOnay.id}`, token || undefined)
                    mesajGoster('Ürün silindi'); yukleUrunler()
                  } else if (silOnay.tip === 'garson') {
                    await apiDelete(`/admin/garsonlar/${silOnay.id}`, token || undefined)
                    mesajGoster('Kullanıcı silindi'); yukle()
                  } else if (silOnay.tip === 'gelir-gider') {
                    await apiDelete(`/admin/gelir-gider/${silOnay.id}`, token || undefined)
                    mesajGoster('Kayıt silindi'); yukleGelirGider()
                  }
                } catch (e: any) { mesajGoster(String(e.message || e)) }
                setSilOnay(null)
              }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
      {mesaj && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-sm z-50">{mesaj}</div>}
    </>
  )
}