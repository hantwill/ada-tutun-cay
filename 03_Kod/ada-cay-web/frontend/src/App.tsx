import { useStore } from './store'
import Login from './pages/Login'
import Masalar from './pages/Masalar'
import Admin from './pages/Admin'
import GarsonIslem from './pages/GarsonIslem'
import MasaDuzeni from './pages/MasaDuzeni'

export default function App() {
  const { token, kullanici, logout, sayfa, setSayfa } = useStore()

  if (!token || !kullanici) {
    return <Login />
  }

  const menuAdmin = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'garsonlar', icon: '👥', label: 'Kullanıcılar' },
    { id: 'masalar', icon: '🪑', label: 'Masalar' },
    { id: 'masa-duzeni', icon: '📐', label: 'Masa Düzeni' },
    { id: 'urunler', icon: '📋', label: 'Ürünler' },
    { id: 'gelir-gider', icon: '💰', label: 'Gelir/Gider' },
    { id: 'raporlar', icon: '📋', label: 'Raporlar' },
  ]

  const menuGarson = [
    { id: 'masalar', icon: '🍽️', label: 'Masalar' },
    { id: 'islem', icon: '📋', label: 'İşlem' },
  ]

  const isGarson = kullanici.rol === 'garson'
  const menu = isGarson ? menuGarson : menuAdmin

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="md:w-60 bg-amber-900 text-white flex md:flex-col flex-row items-center justify-between md:justify-start md:h-full">
        <div className="p-3 md:p-4 md:border-b md:border-amber-700 flex-shrink-0">
          <h1 className="text-base md:text-xl font-bold whitespace-nowrap">🍵 Ada Çay Evi</h1>
          <p className="text-xs md:text-sm text-amber-300 hidden md:block">{kullanici.ad}</p>
        </div>

        <div className="flex md:flex-1 md:flex-col md:p-2 flex-row gap-1 md:gap-0">
          {menu.map((m) => (
            <button key={m.id} onClick={() => setSayfa(m.id)}
              className={`px-3 py-2 md:px-4 md:py-3 rounded-lg md:mb-1 transition text-sm whitespace-nowrap ${
                sayfa === m.id ? 'bg-amber-600' : 'hover:bg-amber-800'
              }`}>{m.icon} <span className="md:inline hidden">{m.label}</span></button>
          ))}
        </div>

        <div className="md:p-2 md:border-t md:border-amber-700 flex-shrink-0">
          <button onClick={logout}
            className="px-3 py-2 md:px-4 md:py-3 rounded-lg hover:bg-red-800 transition text-sm whitespace-nowrap">🚪 <span className="md:inline hidden">Çıkış</span></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isGarson && sayfa === 'masalar' && <Masalar />}
        {isGarson && sayfa === 'islem' && <GarsonIslem />}
        {!isGarson && sayfa === 'masa-duzeni' && <MasaDuzeni />}
        {!isGarson && sayfa !== 'masa-duzeni' && <Admin />}
      </div>
    </div>
  )
}