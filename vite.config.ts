import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/scanner-final/", // آدرس دقیق مخزن جدید
  build: {
    outDir: 'dist',
  }
})
