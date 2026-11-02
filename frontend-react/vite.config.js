import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Відносні шляхи для роботи на GitHub Pages (Webix_OS) та у Telegram WebApp
})
