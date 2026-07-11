import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import ForgeApp from '../presentation/forge/ForgeApp'
import { I18nProvider } from '../presentation/i18n/I18nProvider'
import { AudioProvider } from '../presentation/audio/AudioProvider'

/**
 * Entry de la página de FORGE (forge.html).
 *
 * No está enlazada desde la app principal: es una página de herramienta para admins,
 * separada de `main.tsx` (juego real). Sirve como editor visual de niveles.
 *
 * Monta los mismos providers de i18n y audio que el juego real: el playtest
 * reutiliza el GameView completo, que consume useTranslation() y useAudioContext().
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AudioProvider>
        <ForgeApp />
      </AudioProvider>
    </I18nProvider>
  </StrictMode>,
)
