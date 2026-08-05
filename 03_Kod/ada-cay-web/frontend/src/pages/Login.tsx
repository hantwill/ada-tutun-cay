import { useState } from 'react'
import { useStore, apiPost } from '../store'

export default function Login() {
  const { setLogin } = useStore()
  const [kullanici_ad, setKullaniciAd] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')

  const giris = async () => {
    setHata('')
    try {
      const data = await apiPost('/garson/login', { kullanici_ad, sifre })
      setLogin(data.token, data.kullanici)
    } catch (e: any) {
      setHata(String(e.message || e))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-96">
        <h1 className="text-3xl font-bold text-center text-amber-800 mb-2">🍵 Ada Çay Evi</h1>
        <p className="text-center text-gray-500 mb-6">Giriş Yap</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Kullanıcı Adı</label>
            <input
              type="text"
              value={kullanici_ad}
              onChange={(e) => setKullaniciAd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && giris()}
              placeholder="admin"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Şifre</label>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && giris()}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>
          {hata && <p className="text-red-500 text-sm text-center">{hata}</p>}
          <button
            onClick={giris}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  )
}