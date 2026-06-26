import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // App principal.
        main: 'index.html',
        // Página OCULTA de preview del mock (no enlazada desde la app).
        preview: 'preview.html',
      },
    },
  },
})
