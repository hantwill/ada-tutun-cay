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

interface SatisKalemi {
  urun_id: number
  urun_ad: string
  miktar: number
  birim_fiyat: number
  toplam: number
}

export default function POS() {
  const { kullanici } = useStore()
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [arama, setArama] = useState('')
  const [sepet, setSepet] = useState<SatisKalemi[]>([])
  const [odemeTipi, setOdemeTipi] = useState<'nakit' | 'kart'>('nakit')
  const [indirim, setIndirim] = useState(0)
  const [mesaj, setMesaj] = useState('')

  useEffect(() => {
    invoke<Urun[]>('get_urunler').then(setUrunler).catch(console.error)
  }, [])

  const filtreli = urunler.filter(u =>
    u.ad.toLowerCase().includes(arama.toLowerCase()) ||
    u.barkod?.includes(arama)
  )

  const sepeteEkle = (u: Urun) => {
    if (u.stok <= 0) {
      setMesaj(`${u.ad} stokta yok!`)
      setTimeout(() => setMesaj(''), 3000)
      return
    }
    const existing = sepet.find(s => s.urun_id === u.id)
    if (existing) {
      if (existing.miktar >= u.stok) {
        setMesaj(`${u.ad} için yeterli stok yok! (Stok: ${u.stok})`)
        setTimeout(() => setMesaj(''), 3000)
        return
      }
      setSepet(sepet.map(s => s.urun_id === u.id
        ? { ...s, miktar: s.miktar + 1, toplam: Math.round((s.birim_fiyat * (s.miktar + 1)) * 100) / 100 }
        : s
      ))
    } else {
      setSepet([...sepet, {
        urun_id: u.id,
        urun_ad: u.ad,
        miktar: 1,
        birim_fiyat: u.satis_fiyat,
        toplam: u.satis_fiyat,
      }])
    }
  }

  const sepettenCikar = (id: number) => setSepet(sepet.filter(s => s.urun_id !== id))

  const miktarDegistir = (id: number, miktar: number) => {
    if (miktar < 1) return
    setSepet(sepet.map(s => s.urun_id === id
      ? { ...s, miktar, toplam: Math.round((s.birim_fiyat * miktar) * 100) / 100 }
      : s
    ))
  }

  const araToplam = sepet.reduce((sum, s) => sum + s.toplam, 0)
  const toplam = Math.max(0, Math.round((araToplam - indirim) * 100) / 100)

  const satisTamamla = async () => {
    if (sepet.length === 0) return
    try {
      await invoke('satis_yap', {
        kullaniciId: kullanici?.id,
        odemeTipi,
        indirim,
        kalemler: sepet,
      })
      setMesaj('Satış tamamlandı!')
      setSepet([])
      setIndirim(0)
      invoke<Urun[]>('get_urunler').then(setUrunler)
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) {
      setMesaj(`Hata: ${e}`)
    }
  }

  // Barkod input
  const [barkodInput, setBarkodInput] = useState('')
  const barkodAra = async () => {
    try {
      const u = await invoke<Urun | null>('get_urun_by_barkod', { barkod: barkodInput })
      if (u) {
        sepeteEkle(u)
      } else {
        setMesaj(`Barkod bulunamadı: ${barkodInput}`)
        setTimeout(() => setMesaj(''), 3000)
      }
    } catch (e) {
      setMesaj(`Hata: ${e}`)
      setTimeout(() => setMesaj(''), 3000)
    }
    setBarkodInput('')
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Sol: Ürünler */}
      <div className="flex-1">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Ürün ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Barkod okut"
            value={barkodInput}
            onChange={(e) => setBarkodInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && barkodAra()}
            className="w-48 px-4 py-2 border rounded-lg"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-3 gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          {filtreli.map(u => (
            <button
              key={u.id}
              onClick={() => sepeteEkle(u)}
              disabled={u.stok <= 0}
              className="bg-white p-3 rounded-lg border hover:border-blue-500 hover:shadow-md transition disabled:opacity-50 text-left"
            >
              <p className="font-medium text-sm truncate">{u.ad}</p>
              <p className="text-blue-600 font-bold">{u.satis_fiyat.toFixed(2)} ₺</p>
              <p className={`text-xs ${u.stok <= u.kritik_seviye ? 'text-red-500' : 'text-gray-400'}`}>
                Stok: {u.stok}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Sağ: Sepet */}
      <div className="w-80 bg-white rounded-xl shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">Sepet ({sepet.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {sepet.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">Sepet boş</p>
          ) : (
            sepet.map(s => (
              <div key={s.urun_id} className="flex items-center justify-between py-2 border-b">
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.urun_ad}</p>
                  <p className="text-xs text-gray-500">{s.birim_fiyat.toFixed(2)} ₺ × {s.miktar}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => miktarDegistir(s.urun_id, s.miktar - 1)} className="w-6 h-6 bg-gray-200 rounded">-</button>
                  <span className="w-8 text-center">{s.miktar}</span>
                  <button onClick={() => miktarDegistir(s.urun_id, s.miktar + 1)} className="w-6 h-6 bg-gray-200 rounded">+</button>
                  <span className="w-16 text-right font-medium">{s.toplam.toFixed(2)} ₺</span>
                  <button onClick={() => sepettenCikar(s.urun_id)} className="text-red-500">✕</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span>Ara Toplam:</span><span>{araToplam.toFixed(2)} ₺</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">İndirim:</span>
              <input type="number" value={indirim || ''} onChange={(e) => setIndirim(Number(e.target.value) || 0)}
                className="w-20 px-2 py-1 border rounded text-sm" placeholder="0" />
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Toplam:</span><span>{toplam.toFixed(2)} ₺</span>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setOdemeTipi('nakit')}
              className={`flex-1 py-2 rounded-lg ${odemeTipi === 'nakit' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              Nakit
            </button>
            <button onClick={() => setOdemeTipi('kart')}
              className={`flex-1 py-2 rounded-lg ${odemeTipi === 'kart' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              Kart
            </button>
          </div>
          <button onClick={satisTamamla} disabled={sepet.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50">
            Satışı Tamamla
          </button>
          {mesaj && <p className="text-center mt-2 text-sm text-green-600">{mesaj}</p>}
        </div>
      </div>
    </div>
  )
}