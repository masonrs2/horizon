import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/horizon/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
