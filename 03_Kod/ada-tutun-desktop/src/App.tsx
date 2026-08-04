import { useStore } from './store'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Stok from './pages/Stok'
import Raporlar from './pages/Raporlar'

const menuAdmin = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'pos', label: 'Satış (POS)', icon: '🛒' },
  { id: 'stok', label: 'Stok', icon: '📦' },
  { id: 'raporlar', label: 'Raporlar', icon: '📈' },
]

const menuSatis = [
  { id: 'pos', label: 'Satış (POS)', icon: '🛒' },
  { id: 'dashboard', label: 'Günlük Özet', icon: '📊' },
]

export default function App() {
  const { kullanici, setKullanici, sayfa, setSayfa } = useStore()

  if (!kullanici) return <Login />

  const menu = kullanici.rol === 'admin' ? menuAdmin : menuSatis

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-60 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Ada Tütün</h1>
          <p className="text-xs text-gray-400 mt-1">{kullanici.ad} ({kullanici.rol})</p>
        </div>
        <nav className="flex-1 p-2">
          {menu.map(m => (
            <button
              key={m.id}
              onClick={() => setSayfa(m.id)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
                sayfa === m.id ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={() => setKullanici(null)}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-600 transition"
          >
            🚪 Çıkış
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 p-6 overflow-y-auto">
        {sayfa === 'dashboard' && <Dashboard />}
        {sayfa === 'pos' && <POS />}
        {sayfa === 'stok' && kullanici.rol === 'admin' && <Stok />}
        {sayfa === 'raporlar' && kullanici.rol === 'admin' && <Raporlar />}
      </div>
    </div>
  )
}