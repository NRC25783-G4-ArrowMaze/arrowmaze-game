import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Juego principal (App real)
        main: 'index.html',
        // FORGE: editor de niveles (página oculta, herramienta ADMIN)
        forge: 'forge.html',
      },
    },
  },
})
