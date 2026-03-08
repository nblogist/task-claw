import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    allowedHosts: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api/': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/.well-known/': 'http://localhost:8000',
    },
  },
})
