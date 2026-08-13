import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore, apiGet, apiPut } from '../store'

interface Masa {
  id: number
  numara: string
  ad: string | null
  kapasite: number
  durum: string
  pos_x: number | null
  pos_y: number | null
}

export default function MasaDuzeni() {
  const { token } = useStore()
  const [masalar, setMasalar] = useState<Masa[]>([])
  const [mesaj, setMesaj] = useState('')
  const [dirty, setDirty] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const mesajGoster = (m: string) => { setMesaj(m); setTimeout(() => setMesaj(''), 2500) }

  const yukle = useCallback(async () => {
    try {
      const data = await apiGet('/garson/masalar', token || undefined)
      setMasalar(data)
      setDirty(false)
    } catch (e) { console.error(e) }
  }, [token])

  useEffect(() => { yukle() }, [yukle])

  // --- Drag & Drop (pointer events, touch + mouse) ---
  const onPointerDown = (e: React.PointerEvent, masa: Masa) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const btn = e.currentTarget as HTMLElement
    const btnRect = btn.getBoundingClientRect()
    // Offset = pointer relative to card top-left
    dragRef.current = {
      id: masa.id,
      offsetX: e.clientX - btnRect.left,
      offsetY: e.clientY - btnRect.top,
    }
    setDraggingId(masa.id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // Card is ~110px wide, ~90px tall (w-28 h-24)
    const cardW = 112
    const cardH = 96
    let x = e.clientX - rect.left - dragRef.current.offsetX
    let y = e.clientY - rect.top - dragRef.current.offsetY
    // Clamp inside canvas
    x = Math.max(0, Math.min(x, rect.width - cardW))
    y = Math.max(0, Math.min(y, rect.height - cardH))
    // Convert to percentage of canvas (so it scales)
    const pctX = Math.round((x / rect.width) * 1000) / 10
    const pctY = Math.round((y / rect.height) * 1000) / 10
    setMasalar(prev => prev.map(m => m.id === dragRef.current!.id ? { ...m, pos_x: pctX, pos_y: pctY } : m))
    setDirty(true)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const id = dragRef.current.id
    dragRef.current = null
    setDraggingId(null)
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    // Kaydet
    const masa = masalar.find(m => m.id === id)
    if (masa && masa.pos_x != null && masa.pos_y != null) {
      apiPut(`/admin/masalar/${id}/konum`, { pos_x: masa.pos_x, pos_y: masa.pos_y }, token || undefined)
        .then(() => { setDirty(false) })
        .catch((e: any) => { mesajGoster('Konum kaydedilemedi: ' + (e.message || e)); yukle() })
    }
  }

  const hepsiniKaydet = async () => {
    try {
      for (const m of masalar) {
        if (m.pos_x != null && m.pos_y != null) {
          await apiPut(`/admin/masalar/${m.id}/konum`, { pos_x: m.pos_x, pos_y: m.pos_y }, token || undefined)
        }
      }
      setDirty(false)
      mesajGoster('Tüm konumlar kaydedildi ✓')
    } catch (e: any) { mesajGoster('Hata: ' + (e.message || e)) }
  }

  const otomatikDagit = () => {
    // Grid layout: 4 columns
    const cols = 4
    const cellW = 25 // % width per column
    const cellH = 20 // % height per row
    setMasalar(prev => prev.map((m, i) => ({
      ...m,
      pos_x: (i % cols) * cellW + 2,
      pos_y: Math.floor(i / cols) * cellH + 2,
    })))
    setDirty(true)
    mesajGoster('Otomatik dağıtıldı — kaydet')
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-amber-800">📐 Masa Düzeni</h2>
        <div className="flex gap-2">
          <button onClick={otomatikDagit}
            className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition">
            🔄 Otomatik Diz
          </button>
          <button onClick={hepsiniKaydet}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              dirty ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-gray-200 text-gray-400'
            }`}>
            💾 Kaydet
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Masaları sürükleyerek istediğiniz yere bırakın. Konumlar otomatik kaydedilir.
        Garson ekranında aynı düzende görünür.
      </p>

      {/* Canvas — masaların serbest yerleştirildiği alan */}
      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative flex-1 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-2xl overflow-hidden min-h-[400px] touch-none select-none"
        style={{ touchAction: 'none' }}
      >
        {masalar.map((m) => (
          <div
            key={m.id}
            onPointerDown={(e) => onPointerDown(e, m)}
            className={`absolute w-24 sm:w-28 h-20 sm:h-24 rounded-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-shadow select-none touch-none ${
              draggingId === m.id ? 'shadow-2xl ring-2 ring-amber-500 scale-105 z-50' : 'shadow-md hover:shadow-lg'
            } ${
              m.durum === 'dolu' ? 'bg-red-100 border-2 border-red-300' : 'bg-white border-2 border-amber-200'
            }`}
            style={{
              left: `${m.pos_x ?? 0}%`,
              top: `${m.pos_y ?? 0}%`,
              touchAction: 'none',
            }}
          >
            <div className="text-sm sm:text-base font-bold text-gray-700 text-center leading-tight px-1">
              {m.ad || `Masa ${m.numara}`}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{m.kapasite} kişilik</div>
            {m.durum === 'dolu' && <div className="text-xs text-red-500 font-semibold mt-0.5">🔵 Dolu</div>}
          </div>
        ))}
      </div>

      {mesaj && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-50">
          {mesaj}
        </div>
      )}
    </div>
  )
}