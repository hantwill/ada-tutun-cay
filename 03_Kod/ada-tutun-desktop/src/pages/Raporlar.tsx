import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useStore } from '../store'

interface Satis {
  id: number
  tarih: string
  kullanici_ad: string
  ara_toplam: number
  indirim: number
  toplam: number
  odeme_tipi: string
  durum: string
}

export default function Raporlar() {
  const { kullanici } = useStore()
  const [satislar, setSatislar] = useState<Satis[]>([])
  const [baslangic, setBaslangic] = useState(new Date().toISOString().split('T')[0])
  const [bitis, setBitis] = useState(new Date().toISOString().split('T')[0])
  const [gelir, setGelir] = useState(0)
  const [gider, setGider] = useState(0)
  const [yeniTip, setYeniTip] = useState<'gelir' | 'gider'>('gelir')
  const [yeniMiktar, setYeniMiktar] = useState(0)
  const [yeniAciklama, setYeniAciklama] = useState('')

  const yukle = () => {
    invoke<Satis[]>('get_rapor', { baslangic, bitis }).then(setSatislar).catch(console.error)
  }

  useEffect(() => { yukle() }, [baslangic, bitis])

  const toplamCiro = satislar.filter(s => s.durum === 'tamamlandi').reduce((sum, s) => sum + s.toplam, 0)
  const nakitCiro = satislar.filter(s => s.durum === 'tamamlandi' && s.odeme_tipi === 'nakit').reduce((sum, s) => sum + s.toplam, 0)
  const kartCiro = satislar.filter(s => s.durum === 'tamamlandi' && s.odeme_tipi === 'kart').reduce((sum, s) => sum + s.toplam, 0)

  const ekle = async () => {
    if (yeniMiktar <= 0) return
    try {
      await invoke('gelir_gider_ekle', {
        tip: yeniTip, kategori: null, miktar: yeniMiktar,
        aciklama: yeniAciklama || null, kullaniciId: kullanici?.id
      })
      if (yeniTip === 'gelir') setGelir(gelir + yeniMiktar)
      else setGider(gider + yeniMiktar)
      setYeniMiktar(0); setYeniAciklama('')
    } catch (e) { alert(String(e)) }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Raporlar</h2>
      
      {/* Tarih seçici */}
      <div className="flex gap-2 mb-4 items-center">
        <input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <span>-</span>
        <input type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} className="px-3 py-2 border rounded-lg" />
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Toplam Ciro</p><p className="text-xl font-bold text-blue-600">{toplamCiro.toFixed(2)} ₺</p></div>
        <div className="bg-green-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Nakit</p><p className="text-xl font-bold text-green-600">{nakitCiro.toFixed(2)} ₺</p></div>
        <div className="bg-purple-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Kart</p><p className="text-xl font-bold text-purple-600">{kartCiro.toFixed(2)} ₺</p></div>
        <div className="bg-orange-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Satış Adedi</p><p className="text-xl font-bold text-orange-600">{satislar.filter(s => s.durum === 'tamamlandi').length}</p></div>
      </div>

      {/* Gelir/Gider ekle */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-bold mb-3">Gelir / Gider Ekle</h3>
        <div className="flex gap-2 flex-wrap">
          <select value={yeniTip} onChange={(e) => setYeniTip(e.target.value as 'gelir' | 'gider')} className="px-3 py-2 border rounded-lg">
            <option value="gelir">Gelir</option>
            <option value="gider">Gider</option>
          </select>
          <input type="number" value={yeniMiktar || ''} onChange={(e) => setYeniMiktar(Number(e.target.value))}
            className="w-32 px-3 py-2 border rounded-lg" placeholder="Miktar" />
          <input type="text" value={yeniAciklama} onChange={(e) => setYeniAciklama(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg" placeholder="Açıklama" />
          <button onClick={ekle} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Ekle</button>
        </div>
      </div>

      {/* Satış tablosu */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-bold mb-3">Satışlar</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">ID</th><th>Tarih</th><th>Kullanıcı</th><th>Ödeme</th><th>Toplam</th><th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {satislar.map(s => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="py-2">#{s.id}</td>
                <td>{s.tarih}</td>
                <td>{s.kullanici_ad}</td>
                <td>{s.odeme_tipi}</td>
                <td className="font-medium">{s.toplam.toFixed(2)} ₺</td>
                <td className={s.durum === 'tamamlandi' ? 'text-green-600' : 'text-red-500'}>{s.durum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}