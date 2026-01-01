import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/llmpapers/',
  build: {
    outDir: 'dist',
  },
  publicDir: 'public',
})
