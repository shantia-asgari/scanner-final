import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/", // این یعنی پروژه در ریشه دامنه اجرا می‌شود 
  build: {
    outDir: 'dist',
  }
})
