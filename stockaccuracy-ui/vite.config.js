import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApiPlugin } from './mock/plugin.js'

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    allowedHosts: 'all',
    proxy: {
      // Only proxied when VITE_USE_REAL_API=true; otherwise mock plugin intercepts first
    }
  },
  build: {
    outDir: '../StockAccuracy.API/wwwroot',
    emptyOutDir: true,
  }
})
