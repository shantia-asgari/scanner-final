import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // نام مخزن (Repo) شما دقیقاً باید اینجا باشد
  // اگر نام پروژه شما receipt-scanner-pro است، خط زیر درست است:
  base: "/receipt-scanner-pro1/",
})
