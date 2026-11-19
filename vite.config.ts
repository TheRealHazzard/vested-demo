import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the build works at any path (GitHub Pages serves it under /vested-demo/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
