import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: This ensures assets load correctly when hosted on GitHub Pages (e.g. /my-repo/)
  base: './', 
})