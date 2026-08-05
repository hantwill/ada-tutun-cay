import { useStore } from './store'
import Login from './pages/Login'
import Masalar from './pages/Masalar'
import Admin from './pages/Admin'

export default function App() {
  const { token, kullanici, logout, sayfa, setSayfa } = useStore()

  if (!token || !kullanici) {
    return <Login />
  }

  const menuAdmin = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'garsonlar', icon: '👥', label: 'Garsonlar' },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-60 bg-amber-900 text-white flex flex-col">
        <div className="p-4 border-b border-amber-700">
          <h1 className="text-xl font-bold">🍵 Ada Çay Evi</h1>
          <p className="text-sm text-amber-300">{kullanici.ad}</p>
        </div>

        <div className="flex-1 p-2">
          {kullanici.rol === 'garson' && (
            <button
              onClick={() => setSayfa('masalar')}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
                sayfa === 'masalar' ? 'bg-amber-600' : 'hover:bg-amber-800'
              }`}
            >
              🍽️ Masalar
            </button>
          )}
          {kullanici.rol === 'admin' && menuAdmin.map((m) => (
            <button
              key={m.id}
              onClick={() => setSayfa(m.id)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
                sayfa === m.id ? 'bg-amber-600' : 'hover:bg-amber-800'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-amber-700">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-800 transition"
          >
            🚪 Çıkış
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {kullanici.rol === 'garson' && sayfa === 'masalar' && <Masalar />}
        {kullanici.rol === 'admin' && <Admin />}
      </div>
    </div>
  )
}