import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Juego principal (App real)
        main: 'index.html',
        // FORGE: editor de niveles (página oculta, herramienta ADMIN).
        // Fuera del distribuible offline; sigue en dev y en el build web normal.
        ...(mode !== 'offline' ? { forge: 'forge.html' } : {}),
      },
    },
  },
}))
