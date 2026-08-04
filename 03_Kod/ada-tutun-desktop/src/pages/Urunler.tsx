import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useStore } from '../store'

interface Urun {
  id: number
  barkod: string | null
  ad: string
  kategori_id: number | null
  kategori_ad: string | null
  alis_fiyat: number
  satis_fiyat: number
  stok: number
  kritik_seviye: number
  aktif: number
}

export default function Urunler() {
  const { kullanici } = useStore()
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [kategoriler, setKategoriler] = useState<[number, string][]>([])
  const [duzenle, setDuzenle] = useState<Urun | null>(null)
  const [yeni, setYeni] = useState(false)
  const [form, setForm] = useState({
    barkod: '', ad: '', kategori_id: 0, alis_fiyat: 0, satis_fiyat: 0, stok: 0, kritik_seviye: 5
  })
  const [mesaj, setMesaj] = useState('')

  const yukle = () => {
    invoke<Urun[]>('get_urunler').then(setUrunler).catch(console.error)
    invoke<[number, string][]>('get_kategoriler').then(setKategoriler).catch(console.error)
  }

  useEffect(() => { yukle() }, [])

  const kaydet = async () => {
    if (!form.ad.trim()) { setMesaj('Ürün adı gerekli'); return }
    if (form.satis_fiyat <= 0) { setMesaj('Satış fiyatı pozitif olmalı'); return }
    try {
      if (duzenle) {
        await invoke('urun_guncelle', {
          id: duzenle.id,
          barkod: form.barkod || null,
          ad: form.ad,
          kategoriId: form.kategori_id || null,
          alisFiyat: form.alis_fiyat,
          satisFiyat: form.satis_fiyat,
          kritikSeviye: form.kritik_seviye,
        })
        setMesaj('Ürün güncellendi')
      } else {
        await invoke('urun_ekle', {
          barkod: form.barkod || null,
          ad: form.ad,
          kategoriId: form.kategori_id || null,
          alisFiyat: form.alis_fiyat,
          satisFiyat: form.satis_fiyat,
          stok: form.stok,
          kritikSeviye: form.kritik_seviye,
        })
        setMesaj('Ürün eklendi')
      }
      setDuzenle(null); setYeni(false)
      setForm({ barkod: '', ad: '', kategori_id: 0, alis_fiyat: 0, satis_fiyat: 0, stok: 0, kritik_seviye: 5 })
      yukle()
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const sil = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      await invoke('urun_sil', { id })
      yukle()
      setMesaj('Ürün silindi')
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const duzenleAc = (u: Urun) => {
    setDuzenle(u)
    setYeni(false)
    setForm({
      barkod: u.barkod || '',
      ad: u.ad,
      kategori_id: u.kategori_id || 0,
      alis_fiyat: u.alis_fiyat,
      satis_fiyat: u.satis_fiyat,
      stok: u.stok,
      kritik_seviye: u.kritik_seviye,
    })
  }

  const yeniAc = () => {
    setYeni(true)
    setDuzenle(null)
    setForm({ barkod: '', ad: '', kategori_id: 0, alis_fiyat: 0, satis_fiyat: 0, stok: 0, kritik_seviye: 5 })
  }

  const iptal = () => { setDuzenle(null); setYeni(false) }

  // Sadece admin
  if (kullanici?.rol !== 'admin') {
    return <p className="text-red-500">Bu sayfa sadece admin erişimine açıktır.</p>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Ürün Yönetimi</h2>
        <button onClick={yeniAc} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          + Yeni Ürün
        </button>
      </div>

      {(yeni || duzenle) && (
        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h3 className="font-bold mb-4">{duzenle ? 'Ürün Düzenle' : 'Yeni Ürün'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Barkod</label>
              <input type="text" value={form.barkod} onChange={(e) => setForm({ ...form, barkod: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" placeholder="Opsiyonel" />
            </div>
            <div>
              <label className="text-sm">Ürün Adı</label>
              <input type="text" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm">Kategori</label>
              <select value={form.kategori_id} onChange={(e) => setForm({ ...form, kategori_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg">
                <option value={0}>Kategorisiz</option>
                {kategoriler.map(([id, ad]) => <option key={id} value={id}>{ad}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Kritik Seviye</label>
              <input type="number" value={form.kritik_seviye} onChange={(e) => setForm({ ...form, kritik_seviye: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm">Alış Fiyatı (₺)</label>
              <input type="number" step="0.01" value={form.alis_fiyat} onChange={(e) => setForm({ ...form, alis_fiyat: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm">Satış Fiyatı (₺)</label>
              <input type="number" step="0.01" value={form.satis_fiyat} onChange={(e) => setForm({ ...form, satis_fiyat: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            {!duzenle && (
              <div>
                <label className="text-sm">Başlangıç Stok</label>
                <input type="number" value={form.stok} onChange={(e) => setForm({ ...form, stok: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={kaydet} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium">
              {duzenle ? 'Güncelle' : 'Ekle'}
            </button>
            <button onClick={iptal} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
          {mesaj && <p className="mt-2 text-sm text-green-600">{mesaj}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Barkod</th><th>Ürün</th><th>Kategori</th><th>Alış</th><th>Satış</th><th>Stok</th><th>Kritik</th><th></th>
            </tr>
          </thead>
          <tbody>
            {urunler.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="py-2 text-gray-500">{u.barkod || '-'}</td>
                <td className="font-medium">{u.ad}</td>
                <td>{u.kategori_ad || '-'}</td>
                <td>{u.alis_fiyat.toFixed(2)} ₺</td>
                <td className="font-medium">{u.satis_fiyat.toFixed(2)} ₺</td>
                <td className={u.stok <= u.kritik_seviye ? 'text-red-500 font-bold' : ''}>{u.stok}</td>
                <td>{u.kritik_seviye}</td>
                <td className="flex gap-2">
                  <button onClick={() => duzenleAc(u)} className="text-blue-600">Düzenle</button>
                  <button onClick={() => sil(u.id)} className="text-red-500">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}