// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/fx-quick-calc/', // ←ここ重要。リポジトリ名を入れる
})
