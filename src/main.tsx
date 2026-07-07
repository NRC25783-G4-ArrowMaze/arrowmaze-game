import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initSqliteWebStore } from './infrastructure/persistence/sqlite/initWebSqlite'

// El web store de SQLite debe estar listo antes de que el bootstrap de la App
// abra la conexión (en nativo es un no-op).
initSqliteWebStore()
  .catch((error: unknown) => {
    // Sin persistencia web el juego sigue siendo jugable; la factory hará el
    // fallo visible al intentar abrir la BD.
    console.error('[main] No se pudo inicializar el store web de SQLite:', error)
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
