import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApiPlugin } from './mock/plugin.js'

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    allowedHosts: 'all',
    proxy: process.env.VITE_USE_REAL_API
      ? { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
      : {}
  },
  build: {
    outDir: '../StockAccuracy.API/wwwroot',
    emptyOutDir: true,
  }
})
