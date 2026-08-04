import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useStore } from '../store'

interface DashboardData {
  bugun_satis: number
  bugun_adet: number
  bugun_gelir: number
  bugun_gider: number
  aktif_urun: number
  kritik_stok: number
}

export default function Dashboard() {
  const { kullanici } = useStore()
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    invoke<DashboardData>('get_dashboard', { kullaniciId: kullanici?.id || 0 })
      .then(setData)
      .catch(console.error)
  }, [kullanici])

  const cards = [
    { label: 'Bugünkü Satış', value: `${data?.bugun_satis.toFixed(2) ?? '0.00'} ₺`, color: 'from-blue-500 to-blue-600' },
    { label: 'Satış Adedi', value: data?.bugun_adet ?? 0, color: 'from-green-500 to-green-600' },
    { label: 'Gelir', value: `${data?.bugun_gelir.toFixed(2) ?? '0.00'} ₺`, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Gider', value: `${data?.bugun_gider.toFixed(2) ?? '0.00'} ₺`, color: 'from-red-500 to-red-600' },
    { label: 'Aktif Ürün', value: data?.aktif_urun ?? 0, color: 'from-purple-500 to-purple-600' },
    { label: 'Kritik Stok', value: data?.kritik_stok ?? 0, color: 'from-orange-500 to-orange-600' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} text-white p-6 rounded-xl shadow-lg`}>
            <p className="text-sm opacity-90">{c.label}</p>
            <p className="text-2xl font-bold mt-2">{c.value}</p>
          </div>
        ))}
      </div>
      {data?.kritik_stok && data.kritik_stok > 0 ? (
        <div className="mt-6 bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <p className="text-orange-800 font-medium">
            ⚠️ {data.kritik_stok} üründe stok kritik seviyede!
          </p>
        </div>
      ) : null}
    </div>
  )
}