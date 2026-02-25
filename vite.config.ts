import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ai-reader-shelf/', // GitHub Pages 部署的 repo 子目錄路徑
})
