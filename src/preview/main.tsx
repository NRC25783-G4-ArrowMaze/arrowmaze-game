import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import NeonInteractiveBoard from '../presentation/preview/NeonInteractiveBoard'

/**
 * Entry de la página OCULTA de preview (/preview.html).
 *
 * No está enlazada desde la app principal: es una página de prueba para el mock,
 * separada de `main.tsx`. Sirve para validar el render y el layout de forma
 * interactiva sin tocar la app real.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        padding: '28px 16px 48px',
      }}
    >
      <h1 style={{ margin: 0, fontSize: 26 }}>Mock Preview (oculta)</h1>
      <NeonInteractiveBoard />
    </div>
  </StrictMode>,
)
