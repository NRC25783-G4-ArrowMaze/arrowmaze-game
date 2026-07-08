import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initSqliteWebStore } from './infrastructure/persistence/sqlite/initWebSqlite'
import { I18nProvider } from './presentation/i18n/I18nProvider'
import { CapacitorLanguagePreference } from './infrastructure/i18n/CapacitorLanguagePreference'

const languagePreference = new CapacitorLanguagePreference()

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
        <I18nProvider preferenceProvider={languagePreference}>
          <App />
        </I18nProvider>
      </StrictMode>,
    )
  })
