import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
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
      // Aktif shift kontrol — Rust tarafında yok, basit sorgu
      const hareketler = await invoke<any[]>('get_stok_hareketleri', { limit: 5 })
      setGecmis(hareketler)
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
      setMesaj(`Shift açıldı #${id}, açılış kasası: ${acilisKasa} ₺`)
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  const shiftKapat = async () => {
    if (!aktifShift) return
    try {
      await invoke('shift_kapat', { shiftId: aktifShift, kapanisKasa })
      setMesaj(`Shift kapatıldı #${aktifShift}, kapanış: ${kapanisKasa} ₺`)
      setAktifShift(null)
      setAcilisKasa(0)
      setKapanisKasa(0)
      setTimeout(() => setMesaj(''), 3000)
    } catch (e) { setMesaj(`Hata: ${e}`) }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Shift Yönetimi</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Aktif Shift */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Aktif Shift</h3>
          {aktifShift ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-700 font-medium">Shift #{aktifShift} açık</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapanış Kasası (₺)</label>
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
                <p className="text-gray-500">Açık shift yok</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açılış Kasası (₺)</label>
                <input type="number" value={acilisKasa || ''} onChange={(e) => setAcilisKasa(Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
              </div>
              <button onClick={shiftAc} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">
                Shift Aç
              </button>
            </div>
          )}
          {mesaj && <p className="mt-3 text-sm text-center text-blue-600">{mesaj}</p>}
        </div>

        {/* Bilgi */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Kullanıcı Bilgisi</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Ad:</span><span className="font-medium">{kullanici?.ad}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Kullanıcı:</span><span className="font-medium">{kullanici?.kullanici_ad}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Rol:</span><span className="font-medium">{kullanici?.rol}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}