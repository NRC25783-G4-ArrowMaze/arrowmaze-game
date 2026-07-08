import React, { useState } from 'react'
import type { Scene } from '../../game/scene'
import { sceneFromLevelData, toLevelDataDTO } from '../../game/scene'

interface PlaytestOverlayProps {
  scene: Scene
  onClose: () => void
}

/**
 * Simulador básico del juego para el playtest en el editor.
 * Muestra la escena y cuenta movimientos. Sin lógica completa de juego aún.
 */
const PlaytestSimulator: React.FC<{ scene: Scene; onRestart: () => void }> = ({
  scene,
  onRestart,
}) => {
  const [movesUsed, setMovesUsed] = useState(0)

  const handleMove = () => {
    if (movesUsed < scene.allowedMoves) {
      setMovesUsed(movesUsed + 1)
    }
  }

  const canMove = movesUsed < scene.allowedMoves
  const gameWon = movesUsed > 0 && canMove === false // Simplificado: "ganas" si usas todos los movimientos

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        color: '#333',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px', backgroundColor: '#0369a1', color: '#fff' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Playtest: {scene.id}</h2>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Movimientos: {movesUsed} / {scene.allowedMoves}
        </p>
      </div>

      {/* Área de juego (placeholder) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            {gameWon ? '🎉 ¡Ganaste!' : canMove ? '▶ Jugando' : '⏸ Sin movimientos'}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            Celdas: {scene.cells.length} | Flechas: {scene.arrows.length}
          </div>

          {/* Botón de movimiento */}
          {canMove && (
            <button
              onClick={handleMove}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#0369a1',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              Hacer movimiento
            </button>
          )}

          {/* Mensaje final */}
          {gameWon && (
            <div style={{ fontSize: '14px', color: '#16a34a', fontWeight: 'bold' }}>
              ✓ Completaste el nivel
            </div>
          )}

          {!canMove && movesUsed === 0 && (
            <div style={{ fontSize: '14px', color: '#999' }}>
              (Presiona "Hacer movimiento" para probar)
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={onRestart}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reiniciar
        </button>
      </div>
    </div>
  )
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

        {/* Contenido del simulador */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <PlaytestSimulator key={playNonce} scene={playScene} onRestart={handleRestart} />
        </div>
      </div>
    </div>
  )
}
