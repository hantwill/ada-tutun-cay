import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useStore, type Kullanici } from '../store'

export default function Login() {
  const { setKullanici } = useStore()
  const [kullaniciAd, setKullaniciAd] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const giris = async () => {
    if (!kullaniciAd || !sifre) { setHata('Kullanıcı ad ve şifre gerekli'); return }
    setYukleniyor(true)
    setHata('')
    try {
      const sonuc = await invoke<Kullanici | null>('login', {
        kullaniciAd, sifre
      })
      if (sonuc) {
        setKullanici(sonuc)
      } else {
        setHata('Hatalı kullanıcı adı veya şifre')
      }
    } catch (e) {
      setHata(String(e))
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Ada Tütün</h1>
        <p className="text-center text-gray-500 mb-8">Satış & Stok Yönetim</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              value={kullaniciAd}
              onChange={(e) => setKullaniciAd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && giris()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && giris()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••"
            />
          </div>
          {hata && <p className="text-red-500 text-sm text-center">{hata}</p>}
          <button
            onClick={giris}
            disabled={yukleniyor}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">Demo: admin / admin123</p>
      </div>
    </div>
  )
}