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
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: number; startPx: number; startPy: number; origX: number; origY: number } | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mesajGoster = (m: string) => { setMesaj(m); setTimeout(() => setMesaj(''), 2500) }

  const yukle = useCallback(async () => {
    try {
      const data = await apiGet('/garson/masalar', token || undefined)
      setMasalar(data)
    } catch (e) { console.error(e) }
  }, [token])

  useEffect(() => { yukle() }, [yukle])

  // Debounced save — sürükleme bittikten 500ms sonra kaydet
  const konumKaydet = useCallback((id: number, x: number, y: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await apiPut(`/admin/masalar/${id}/konum`, { pos_x: x, pos_y: y }, token || undefined)
      } catch (e: any) { mesajGoster('Konum kaydedilemedi') }
    }, 500)
  }, [token])

  // --- Drag & Drop ---
  const onPointerDown = (e: React.PointerEvent, masa: Masa) => {
    e.preventDefault()
    e.stopPropagation()
    const canvas = canvasRef.current
    if (!canvas) return
    dragRef.current = {
      id: masa.id,
      startPx: e.clientX,
      startPy: e.clientY,
      origX: masa.pos_x ?? 0,
      origY: masa.pos_y ?? 0,
    }
    setDraggingId(masa.id)
    // Canvas'a capture al (card'a değil)
    canvas.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // Pixel farkı → yüzde farkı
    const dxPct = ((e.clientX - dragRef.current.startPx) / rect.width) * 100
    const dyPct = ((e.clientY - dragRef.current.startPy) / rect.height) * 100
    let newX = dragRef.current.origX + dxPct
    let newY = dragRef.current.origY + dyPct
    // Clamp 0-82% (card ~18% genişliğinde)
    newX = Math.max(0, Math.min(newX, 82))
    newY = Math.max(0, Math.min(newY, 78))
    const id = dragRef.current.id
    setMasalar(prev => prev.map(m => m.id === id ? { ...m, pos_x: Math.round(newX * 10) / 10, pos_y: Math.round(newY * 10) / 10 } : m))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const id = dragRef.current.id
    const canvas = canvasRef.current
    dragRef.current = null
    setDraggingId(null)
    if (canvas) {
      try { canvas.releasePointerCapture(e.pointerId) } catch {}
    }
    // Kaydet
    const masa = masalar.find(m => m.id === id)
    if (masa && masa.pos_x != null && masa.pos_y != null) {
      konumKaydet(id, masa.pos_x, masa.pos_y)
    }
  }

  const otomatikDagit = () => {
    setMasalar(prev => prev.map((m, i) => ({
      ...m,
      pos_x: (i % 5) * 18 + 2,
      pos_y: Math.floor(i / 5) * 22 + 2,
    })))
    mesajGoster('Otomatik dağıtıldı — kaydediliyor...')
    // Tümünü kaydet
    setTimeout(async () => {
      try {
        const data = await apiGet('/garson/masalar', token || undefined)
        for (const m of data) {
          const idx = data.indexOf(m)
          const newPos = { x: (idx % 5) * 18 + 2, y: (Math.floor(idx / 5) * 22 + 2) }
          await apiPut(`/admin/masalar/${m.id}/konum`, { pos_x: newPos.x, pos_y: newPos.y }, token || undefined)
        }
        mesajGoster('Kaydedildi ✓')
      } catch { mesajGoster('Hata') }
    }, 100)
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-amber-800">📐 Masa Düzeni</h2>
        <button onClick={otomatikDagit}
          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition">
          🔄 Otomatik Diz
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Masaları sürükleyerek istediğiniz yere bırakın. Bıraktığınızda otomatik kaydedilir.
      </p>

      <div className="flex-1 flex items-center justify-center min-h-0">
        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative w-full aspect-[3/2] max-h-full max-w-full bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-2xl overflow-hidden touch-none select-none"
          style={{ touchAction: 'none' }}
        >
        {masalar.map((m) => (
          <div
            key={m.id}
            onPointerDown={(e) => onPointerDown(e, m)}
            className={`masa-kart absolute w-[18%] min-w-[48px] aspect-[5/4] rounded-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none ${
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
            <div className="text-[14px] sm:text-base font-bold text-gray-700 text-center leading-tight px-1 truncate w-full">
              {m.ad || `Masa ${m.numara}`}
            </div>
            <div className="text-[13px] sm:text-sm text-gray-400 mt-0.5">{m.kapasite} kişilik</div>
            {m.durum === 'dolu' && <div className="text-[13px] sm:text-sm text-red-500 font-semibold mt-0.5">🔵 Dolu</div>}
          </div>
        ))}
        </div>
      </div>

      {mesaj && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-50">
          {mesaj}
        </div>
      )}
    </div>
  )
}