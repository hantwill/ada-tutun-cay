import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 80 << 16,
        firefox: 80 << 16,
        safari: 14 << 16,
        edge: 80 << 16,
      },
    },
  },
  build: {
    // Production'da source map kapalı (console errors + bundle size)
    sourcemap: false,
    target: 'es2020',
  },
})