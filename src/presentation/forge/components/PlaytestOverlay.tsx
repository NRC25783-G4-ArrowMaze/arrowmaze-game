import React, { useState } from 'react'
import type { Scene } from '../../game/scene'
import { sceneFromLevelData, toLevelDataDTO } from '../../game/scene'
import { GameView } from '../../components/GameView'
// GameView depende de los estilos de App.css (.app, .board-frame, stats…). El
// bundle del FORGE no carga App.tsx, así que sin este import el tablero se
// renderiza sin dimensionar y se desborda del modal.
import '../../../App.css'

interface PlaytestOverlayProps {
  scene: Scene
  onClose: () => void
}

export const PlaytestOverlay: React.FC<PlaytestOverlayProps> = ({ scene, onClose }) => {
  const [playNonce, setPlayNonce] = useState(0)

  const handleRestart = () => {
    setPlayNonce((n) => n + 1)
  }

  // Normaliza la escena: convierte a DTO y de vuelta para aplicar reglas de dominio
  // (asigna colores por paleta, valida estructura)
  let playScene = scene
  try {
    const dto = toLevelDataDTO(scene)
    playScene = sceneFromLevelData(dto)
  } catch (err) {
    console.error('[PlaytestOverlay] Error normalizando escena:', err)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      {/* Modal */}
      <div
        style={{
          width: '90%',
          maxWidth: '800px',
          height: '90%',
          backgroundColor: '#fff',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f3f4f6',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px' }}>Playtest del nivel</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRestart}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reiniciar
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Volver al editor
            </button>
          </div>
        </div>

        {/* Contenido: motor de juego real sobre la escena editada. La `key`
            remonta el GameView (que congela la escena en el primer render), así
            "Reiniciar" arranca una partida limpia sobre la escena actual. */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <div className="forge-playtest">
            <GameView
              key={playNonce}
              scene={playScene}
              progressModule={null}
              difficulty={playScene.difficulty}
              onBack={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
