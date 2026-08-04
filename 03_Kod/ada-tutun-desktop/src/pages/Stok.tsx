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

export default function Stok() {
  const { kullanici } = useStore()
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [secili, setSecili] = useState<Urun | null>(null)
  const [miktar, setMiktar] = useState(1)
  const [aciklama, setAciklama] = useState('')
  const [tip, setTip] = useState<'giris' | 'cikis'>('giris')
  const [mesaj, setMesaj] = useState('')

  const yukle = () => invoke<Urun[]>('get_urunler').then(setUrunler).catch(console.error)

  useEffect(() => { yukle() }, [])

  const islemYap = async () => {
    if (!secili || miktar < 1) return
    try {
      if (tip === 'giris') {
        await invoke('stok_gir', {
          urunId: secili.id, miktar, aciklama: aciklama || null, kullaniciId: kullanici?.id
        })
      } else {
        await invoke('stok_cik', {
          urunId: secili.id, miktar, aciklama: aciklama || null, kullaniciId: kullanici?.id
        })
      }
      setMesaj(`${tip === 'giris' ? 'Stok girişi' : 'Stok çıkışı'} başarılı: ${secili.ad} +${miktar}`)
      setSecili(null); setMiktar(1); setAciklama('')
      yukle()
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) {
      setMesaj(`Hata: ${e}`)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Stok Yönetimi</h2>
      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-xl shadow p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Ürün</th><th>Kategori</th><th>Stok</th><th>Kritik</th><th></th>
              </tr>
            </thead>
            <tbody>
              {urunler.map(u => (
                <tr key={u.id} className={`border-b hover:bg-gray-50 ${secili?.id === u.id ? 'bg-blue-50' : ''}`}>
                  <td className="py-2">{u.ad}</td>
                  <td>{u.kategori_ad || '-'}</td>
                  <td className={u.stok <= u.kritik_seviye ? 'text-red-500 font-bold' : ''}>{u.stok}</td>
                  <td>{u.kritik_seviye}</td>
                  <td><button onClick={() => setSecili(u)} className="text-blue-600">Seç</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-72 bg-white rounded-xl shadow p-4">
          {secili ? (
            <>
              <h3 className="font-bold mb-2">{secili.ad}</h3>
              <p className="text-sm text-gray-500 mb-4">Mevcut stok: {secili.stok}</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => setTip('giris')} className={`flex-1 py-2 rounded ${tip === 'giris' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Giriş</button>
                  <button onClick={() => setTip('cikis')} className={`flex-1 py-2 rounded ${tip === 'cikis' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Çıkış</button>
                </div>
                <div>
                  <label className="text-sm">Miktar</label>
                  <input type="number" min={1} value={miktar} onChange={(e) => setMiktar(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm">Açıklama</label>
                  <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="Opsiyonel" />
                </div>
                <button onClick={islemYap} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">
                  {tip === 'giris' ? 'Stok Gir' : 'Stok Çıkar'}
                </button>
                {mesaj && <p className="text-sm text-green-600 text-center">{mesaj}</p>}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-center mt-8">Ürün seçin</p>
          )}
        </div>
      </div>
    </div>
  )
}