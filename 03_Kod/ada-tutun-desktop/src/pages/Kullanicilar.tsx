import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useStore } from '../store'
import { formatTarihKisa } from '../tarih'

interface KullaniciListe {
  id: number
  kullanici_ad: string
  ad: string
  rol: string
  aktif: number
  olusturma_tarih: string
}

export default function Kullanicilar() {
  const { kullanici } = useStore()
  const [list, setList] = useState<KullaniciListe[]>([])
  const [yeni, setYeni] = useState(false)
  const [form, setForm] = useState({ kullanici_ad: '', ad: '', sifre: '', rol: 'satis' })
  const [sifreDegistirId, setSifreDegistirId] = useState<number | null>(null)
  const [yeniSifre, setYeniSifre] = useState('')
  const [mesaj, setMesaj] = useState('')

  const yukle = () => {
    invoke<KullaniciListe[]>('get_kullanicilar').then(setList).catch(console.error)
  }

  useEffect(() => { yukle() }, [])

  const ekle = async () => {
    if (!form.kullanici_ad.trim() || !form.ad.trim() || !form.sifre) {
      setMesaj('Tüm alanları doldurun')
      return
    }
    try {
      await invoke('kullanici_ekle', {
        kullaniciAd: form.kullanici_ad,
        sifre: form.sifre,
        ad: form.ad,
        rol: form.rol,
      })
      setMesaj('Kullanıcı eklendi')
      setYeni(false)
      setForm({ kullanici_ad: '', ad: '', sifre: '', rol: 'satis' })
      yukle()
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const sil = async (id: number, ad: string) => {
    if (!confirm(`"${ad}" kullanıcısını silmek istediğinize emin misiniz?`)) return
    try {
      await invoke('kullanici_sil', { kullaniciId: id })
      setMesaj('Kullanıcı silindi')
      yukle()
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const sifreKaydet = async () => {
    if (!sifreDegistirId || !yeniSifre) return
    try {
      await invoke('kullanici_sifre_degistir', { kullaniciId: sifreDegistirId, yeniSifre })
      setMesaj('Şifre güncellendi')
      setSifreDegistirId(null)
      setYeniSifre('')
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const rolDegistir = async (k: KullaniciListe, yeniRol: string) => {
    try {
      await invoke('kullanici_guncelle', {
        kullaniciId: k.id,
        ad: k.ad,
        rol: yeniRol,
        aktif: k.aktif === 1,
      })
      yukle()
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const aktifDegistir = async (k: KullaniciListe) => {
    try {
      await invoke('kullanici_guncelle', {
        kullaniciId: k.id,
        ad: k.ad,
        rol: k.rol,
        aktif: k.aktif !== 1,
      })
      yukle()
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  // Sadece admin
  if (kullanici?.rol !== 'admin') {
    return <p className="text-red-500">Bu sayfa sadece admin erişimine açıktır.</p>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Kullanıcı Yönetimi</h2>
        <button
          onClick={() => { setYeni(!yeni); setForm({ kullanici_ad: '', ad: '', sifre: '', rol: 'satis' }) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          {yeni ? 'İptal' : '+ Yeni Kullanıcı'}
        </button>
      </div>

      {/* Yeni kullanıcı formu */}
      {yeni && (
        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h3 className="font-bold mb-4">Yeni Kullanıcı Ekle</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Kullanıcı Adı</label>
              <input type="text" value={form.kullanici_ad} onChange={(e) => setForm({ ...form, kullanici_ad: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" placeholder="örn: ahmet" />
            </div>
            <div>
              <label className="text-sm">Ad Soyad</label>
              <input type="text" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" placeholder="örn: Ahmet Yılmaz" />
            </div>
            <div>
              <label className="text-sm">Şifre</label>
              <input type="password" value={form.sifre} onChange={(e) => setForm({ ...form, sifre: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" placeholder="En az 3 karakter" />
            </div>
            <div>
              <label className="text-sm">Rol</label>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg">
                <option value="satis">Satış</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button onClick={ekle} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-medium">
            Ekle
          </button>
        </div>
      )}

      {/* Şifre değiştirme modali */}
      {sifreDegistirId && (
        <div className="bg-white rounded-xl shadow p-6 mb-4 border-2 border-blue-400">
          <h3 className="font-bold mb-4">Şifre Değiştir — #{sifreDegistirId}</h3>
          <div className="flex gap-2">
            <input type="password" value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg" placeholder="Yeni sifre" />
            <button onClick={sifreKaydet} className="bg-green-600 text-white px-4 py-2 rounded-lg">Kaydet</button>
            <button onClick={() => { setSifreDegistirId(null); setYeniSifre('') }} className="bg-gray-200 px-4 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      {/* Kullanıcı tablosu */}
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">ID</th><th>Kullanıcı Adı</th><th>Ad</th><th>Rol</th><th>Aktif</th><th>Oluşturma</th><th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(k => (
              <tr key={k.id} className="border-b hover:bg-gray-50">
                <td className="py-2">#{k.id}</td>
                <td className="font-medium">{k.kullanici_ad}</td>
                <td>{k.ad}</td>
                <td>
                  <select
                    value={k.rol}
                    onChange={(e) => rolDegistir(k, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-medium ${k.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                  >
                    <option value="satis">Satış</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => aktifDegistir(k)}
                    className={`px-2 py-1 rounded text-xs font-medium ${k.aktif === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {k.aktif === 1 ? 'Aktif' : 'Pasif'}
                  </button>
                </td>
                <td className="text-gray-500">{formatTarihKisa(k.olusturma_tarih)}</td>
                <td className="flex gap-2">
                  <button onClick={() => setSifreDegistirId(k.id)} className="text-blue-600 text-xs">Şifre</button>
                  {k.kullanici_ad !== 'admin' && (
                    <button onClick={() => sil(k.id, k.ad)} className="text-red-500 text-xs">Sil</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mesaj && <p className="mt-4 text-sm text-center text-blue-600">{mesaj}</p>}
    </div>
  )
}