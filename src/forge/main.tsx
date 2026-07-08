import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import ForgeApp from '../presentation/forge/ForgeApp'

/**
 * Entry de la página de FORGE (forge.html).
 *
 * No está enlazada desde la app principal: es una página de herramienta para admins,
 * separada de `main.tsx` (juego real). Sirve como editor visual de niveles.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ForgeApp />
  </StrictMode>,
)
