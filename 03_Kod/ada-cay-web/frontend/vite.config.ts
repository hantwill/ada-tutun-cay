import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Ada Çay Evi',
        short_name: 'AdaÇay',
        description: 'Ada Çay Evi Adisyon Yönetim Sistemi',
        theme_color: '#d97706',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        lang: 'tr',
        dir: 'ltr',
        scope: '/',
        categories: ['business', 'productivity'],
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Production'da source map kapalı
        sourcemap: false,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
  build: {
    // Production'da source map kapalı (console errors + bundle size)
    sourcemap: false,
  },
})