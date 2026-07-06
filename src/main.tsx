import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

/**
 * Entry de la app principal del juego.
 *
 * Placeholder: la implementación real de GameView, etc., vendrá en sprints posteriores.
 */
function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>ArrowMaze</h1>
      <p>Juego principal (TODO: implementar en sprints posteriores)</p>
      <p>
        <a href="/forge.html">→ Ir al FORGE (editor de niveles)</a>
      </p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
