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
      '/api/': process.env.VITE_API_URL || 'http://localhost:8000',
      '/health': process.env.VITE_API_URL || 'http://localhost:8000',
      '/.well-known/': process.env.VITE_API_URL || 'http://localhost:8000',
      '/llms.txt': process.env.VITE_API_URL || 'http://localhost:8000',
    },
  },
})
