import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { save, open } from '@tauri-apps/plugin-dialog'
import { useStore } from '../store'

export default function Shift() {
  const { kullanici } = useStore()
  const [acilisKasa, setAcilisKasa] = useState(0)
  const [kapanisKasa, setKapanisKasa] = useState(0)
  const [aktifShift, setAktifShift] = useState<number | null>(null)
  const [mesaj, setMesaj] = useState('')
  const [gecmis, setGecmis] = useState<any[]>([])

  const yukle = async () => {
    try {
      // Aktif shift kontrolu — Rust'tan sorgula
      const id = await invoke<number | null>('get_aktif_shift', { kullaniciId: kullanici?.id })
      setAktifShift(id)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { yukle() }, [])

  const shiftAc = async () => {
    if (acilisKasa < 0) return
    try {
      const id = await invoke<number>('shift_ac', {
        kullaniciId: kullanici?.id, acilisKasa
      })
      setAktifShift(id)
      setMesaj(`Shift acildi #${id}, acilis kasasi: ${acilisKasa} TL`)
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const shiftKapat = async () => {
    if (!aktifShift) return
    try {
      await invoke('shift_kapat', { shiftId: aktifShift, kapanisKasa })
      setMesaj(`Shift kapatildi #${aktifShift}, kapanis: ${kapanisKasa} TL`)
      setAktifShift(null)
      setAcilisKasa(0)
      setKapanisKasa(0)
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const yedekle = async () => {
    try {
      // Tauri dialog ile kaydetme yeri sec
      const path = await save({
        title: 'Veritabani yedegi kaydet',
        defaultPath: `ada_tutun_yedek_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'SQLite DB', extensions: ['db'] }]
      })
      if (!path) return

      // Rust'a yolu gonder
      const result = await invoke<string>('db_yedekle_yol', { hedefYol: path })
      setMesaj(`Yedeklendi: ${result}`)
      setTimeout(() => setMesaj(''), 5000)
    } catch (e) {
      setMesaj(`Hata: ${e}`)
      setTimeout(() => setMesaj(''), 5000)
    }
  }

  const geriYukle = async () => {
    if (!confirm('Geri yukleme mevcut verilerin uzerine yazacak. Once otomatik yedek alinacak. Devam?')) return
    try {
      // Tauri dialog ile dosya sec
      const path = await open({
        title: 'Yedek dosyasi sec',
        filters: [{ name: 'SQLite DB', extensions: ['db'] }]
      })
      if (!path || Array.isArray(path)) return

      const msg = await invoke<string>('db_geri_yukle_yol', { kaynakYol: path })
      setMesaj(msg)
      setTimeout(() => setMesaj(''), 5000)
    } catch (e) {
      setMesaj(`Hata: ${e}`)
      setTimeout(() => setMesaj(''), 5000)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Shift Yonetimi</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Aktif Shift */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Aktif Shift</h3>
          {aktifShift ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-700 font-medium">Shift #{aktifShift} acik</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapanis Kasasi (TL)</label>
                <input type="number" value={kapanisKasa || ''} onChange={(e) => setKapanisKasa(Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
              </div>
              <button onClick={shiftKapat} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg">
                Shift Kapat
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500">Acik shift yok</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acilis Kasasi (TL)</label>
                <input type="number" value={acilisKasa || ''} onChange={(e) => setAcilisKasa(Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
              </div>
              <button onClick={shiftAc} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">
                Shift Ac
              </button>
            </div>
          )}
          {mesaj && <p className="mt-3 text-sm text-center text-blue-600">{mesaj}</p>}
        </div>

        {/* Bilgi */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Kullanici Bilgisi</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Ad:</span><span className="font-medium">{kullanici?.ad}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Kullanici:</span><span className="font-medium">{kullanici?.kullanici_ad}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Rol:</span><span className="font-medium">{kullanici?.rol}</span></div>
          </div>
        </div>
      </div>

      {/* Yedekleme */}
      <div className="bg-white rounded-xl shadow p-6 mt-4">
        <h3 className="font-bold text-lg mb-4">Veritabani Yedekleme</h3>
        <div className="flex gap-3">
          <button onClick={yedekle} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            DB Yedekle
          </button>
          <button onClick={geriYukle} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium">
            DB Geri Yukle
          </button>
        </div>
      </div>
    </div>
  )
}