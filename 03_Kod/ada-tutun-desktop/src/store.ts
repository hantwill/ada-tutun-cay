import { create } from 'zustand'

export interface Kullanici {
  id: number
  kullanici_ad: string
  ad: string
  rol: 'admin' | 'satis'
}

interface AppStore {
  kullanici: Kullanici | null
  setKullanici: (k: Kullanici | null) => void
  sayfa: string
  setSayfa: (s: string) => void
}

export const useStore = create<AppStore>((set) => ({
  kullanici: null,
  setKullanici: (k) => set({ kullanici: k }),
  sayfa: 'dashboard',
  setSayfa: (s) => set({ sayfa: s }),
}))