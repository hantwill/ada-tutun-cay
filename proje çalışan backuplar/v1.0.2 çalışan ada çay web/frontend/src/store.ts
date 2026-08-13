import { create } from 'zustand'

interface Kullanici {
  id: number
  kullanici_ad: string
  ad: string
  rol: 'admin' | 'garson'
}

interface AppStore {
  token: string | null
  kullanici: Kullanici | null
  setLogin: (token: string, kullanici: Kullanici) => void
  logout: () => void
  sayfa: string
  setSayfa: (s: string) => void
}

export const useStore = create<AppStore>((set) => ({
  token: localStorage.getItem('token'),
  kullanici: (() => {
    try {
      const raw = localStorage.getItem('kullanici')
      return raw ? JSON.parse(raw) : null
    } catch {
      localStorage.removeItem('kullanici')
      return null
    }
  })(),
  setLogin: (token, kullanici) => {
    localStorage.setItem('token', token)
    localStorage.setItem('kullanici', JSON.stringify(kullanici))
    set({ token, kullanici, sayfa: kullanici.rol === 'admin' ? 'dashboard' : 'masalar' })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('kullanici')
    set({ token: null, kullanici: null, sayfa: 'masalar' })
  },
  sayfa: (() => {
    try {
      const raw = localStorage.getItem('kullanici')
      if (!raw) return 'masalar'
      const k = JSON.parse(raw)
      return k?.rol === 'admin' ? 'dashboard' : 'masalar'
    } catch {
      return 'masalar'
    }
  })(),
  setSayfa: (s) => set({ sayfa: s }),
}))

const API = import.meta.env.VITE_API_URL || ''

export async function apiGet(path: string, token?: string) {
  const res = await fetch(`${API}/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    useStore.getState().logout()
    throw new Error('Oturum süresi doldu')
  }
  if (!res.ok) {
    const txt = await res.text()
    try { throw new Error(JSON.parse(txt)?.hata || 'Hata') } catch { throw new Error(txt || 'Hata') }
  }
  return res.json()
}

export async function apiPost(path: string, body: any, token?: string) {
  const res = await fetch(`${API}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (res.status === 401 && !path.includes('/login')) {
    useStore.getState().logout()
    throw new Error('Oturum süresi doldu')
  }
  if (!res.ok) {
    const txt = await res.text()
    try { throw new Error(JSON.parse(txt)?.hata || 'Hata') } catch { throw new Error(txt || 'Hata') }
  }
  return res.json()
}

export async function apiPut(path: string, body: any, token?: string) {
  const res = await fetch(`${API}/api${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (res.status === 401) {
    useStore.getState().logout()
    throw new Error('Oturum süresi doldu')
  }
  if (!res.ok) {
    const txt = await res.text()
    try { throw new Error(JSON.parse(txt)?.hata || 'Hata') } catch { throw new Error(txt || 'Hata') }
  }
  return res.json()
}

export async function apiDelete(path: string, token?: string) {
  const res = await fetch(`${API}/api${path}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    useStore.getState().logout()
    throw new Error('Oturum süresi doldu')
  }
  if (!res.ok) {
    const txt = await res.text()
    try { throw new Error(JSON.parse(txt)?.hata || 'Hata') } catch { throw new Error(txt || 'Hata') }
  }
  return res.json()
}