import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useStore } from '../store'
import { formatTarih, isoToTr } from '../tarih'

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

interface GelirGiderKayit {
  id: number
  tip: string
  kategori: string | null
  miktar: number
  aciklama: string | null
  tarih: string
}

export default function Raporlar() {
  const { kullanici } = useStore()
  const [satislar, setSatislar] = useState<Satis[]>([])
  const [gelirGider, setGelirGider] = useState<GelirGiderKayit[]>([])
  const today = new Date()
  const [baslangic, setBaslangic] = useState(today.toISOString().split('T')[0])
  const [bitis, setBitis] = useState(today.toISOString().split('T')[0])
  const [yeniTip, setYeniTip] = useState<'gelir' | 'gider'>('gelir')
  const [yeniMiktar, setYeniMiktar] = useState(0)
  const [yeniAciklama, setYeniAciklama] = useState('')
  const [exportYukleniyor, setExportYukleniyor] = useState(false)
  const [mesaj, setMesaj] = useState('')

  const yukle = () => {
    invoke<Satis[]>('get_rapor', { baslangic, bitis }).then(setSatislar).catch(console.error)
    invoke<GelirGiderKayit[]>('get_gelir_gider', { baslangic, bitis }).then(setGelirGider).catch(console.error)
  }

  useEffect(() => { yukle() }, [baslangic, bitis])

  const satisToplam = satislar.filter(s => s.durum === 'tamamlandi').reduce((sum, s) => sum + s.toplam, 0)
  const nakitCiro = satislar.filter(s => s.durum === 'tamamlandi' && s.odeme_tipi === 'nakit').reduce((sum, s) => sum + s.toplam, 0)
  const kartCiro = satislar.filter(s => s.durum === 'tamamlandi' && s.odeme_tipi === 'kart').reduce((sum, s) => sum + s.toplam, 0)
  const gelirToplam = gelirGider.filter(g => g.tip === 'gelir').reduce((sum, g) => sum + g.miktar, 0)
  const giderToplam = gelirGider.filter(g => g.tip === 'gider').reduce((sum, g) => sum + g.miktar, 0)
  // Net ciro = satış + ek gelir - gider
  const netCiro = satisToplam + gelirToplam - giderToplam

  const ekle = async () => {
    if (yeniMiktar <= 0) return
    try {
      await invoke('gelir_gider_ekle', {
        tip: yeniTip, kategori: null, miktar: yeniMiktar,
        aciklama: yeniAciklama || null, kullaniciId: kullanici?.id
      })
      setYeniMiktar(0); setYeniAciklama('')
      yukle()
    } catch (e) { alert(String(e)) }
  }

  const excelAktar = async () => {
    setExportYukleniyor(true)
    setMesaj('')
    try {
      const path = await invoke<string>('export_satislar_csv', { baslangic, bitis })
      setMesaj(`Excel'e aktarıldı: ${path}`)
    } catch (e) {
      if (String(e) !== 'Dosya secimi iptal edildi') {
        setMesaj(`Hata: ${e}`)
      }
    } finally {
      setExportYukleniyor(false)
      setTimeout(() => setMesaj(''), 5000)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Raporlar</h2>
        <button
          onClick={excelAktar}
          disabled={exportYukleniyor}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {exportYukleniyor ? 'Aktarılıyor...' : '📊 Excel\'e Aktar'}
        </button>
      </div>

      {/* Tarih seçici */}
      <div className="flex gap-2 mb-4 items-center">
        <label className="text-sm text-gray-500">Başlangıç:</label>
        <input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <span className="text-gray-400">-</span>
        <label className="text-sm text-gray-500">Bitiş:</label>
        <input type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <span className="text-sm text-gray-400 ml-2">({isoToTr(baslangic)} - {isoToTr(bitis)})</span>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Satış Ciro</p><p className="text-xl font-bold text-blue-600">{satisToplam.toFixed(2)} ₺</p></div>
        <div className="bg-green-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Nakit</p><p className="text-xl font-bold text-green-600">{nakitCiro.toFixed(2)} ₺</p></div>
        <div className="bg-purple-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Kart</p><p className="text-xl font-bold text-purple-600">{kartCiro.toFixed(2)} ₺</p></div>
        <div className="bg-emerald-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Ek Gelir</p><p className="text-xl font-bold text-emerald-600">{gelirToplam.toFixed(2)} ₺</p></div>
        <div className="bg-red-50 p-4 rounded-xl"><p className="text-sm text-gray-500">Gider</p><p className="text-xl font-bold text-red-600">{giderToplam.toFixed(2)} ₺</p></div>
      </div>

      {/* Net ciro barı */}
      <div className="bg-gray-800 text-white p-4 rounded-xl mb-6 flex justify-between items-center">
        <span className="text-lg font-medium">Net Ciro (Satış + Gelir - Gider)</span>
        <span className={`text-2xl font-bold ${netCiro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{netCiro.toFixed(2)} ₺</span>
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
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-bold mb-3">Satışlar ({satislar.length})</h3>
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
                <td>{formatTarih(s.tarih)}</td>
                <td>{s.kullanici_ad}</td>
                <td>{s.odeme_tipi}</td>
                <td className="font-medium">{s.toplam.toFixed(2)} ₺</td>
                <td className={s.durum === 'tamamlandi' ? 'text-green-600' : 'text-red-500'}>{s.durum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gelir/Gider tablosu */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-bold mb-3">Gelir / Gider Tablosu ({gelirGider.length})</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">ID</th><th>Tarih</th><th>Tip</th><th>Kategori</th><th>Açıklama</th><th>Miktar</th>
            </tr>
          </thead>
          <tbody>
            {gelirGider.length === 0 ? (
              <tr><td colSpan={6} className="py-4 text-center text-gray-400">Bu tarih aralığında gelir/gider kaydı yok</td></tr>
            ) : (
              gelirGider.map(g => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">#{g.id}</td>
                  <td>{formatTarih(g.tarih)}</td>
                  <td className={g.tip === 'gelir' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {g.tip === 'gelir' ? 'Gelir' : 'Gider'}
                  </td>
                  <td>{g.kategori || '-'}</td>
                  <td>{g.aciklama || '-'}</td>
                  <td className={g.tip === 'gelir' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {g.tip === 'gelir' ? '+' : '-'}{g.miktar.toFixed(2)} ₺
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mesaj && <p className="mt-4 text-sm text-center text-blue-600">{mesaj}</p>}
    </div>
  )
}