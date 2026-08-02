import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  // Resolve root explicitly to handle Windows paths with spaces
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, 'dist'),
  },
  server: {
    port: 5173,
    proxy: {
      '/crawl':     { target: 'http://localhost:8000', changeOrigin: true },
      '/status':    { target: 'http://localhost:8000', changeOrigin: true },
      '/downloads': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
