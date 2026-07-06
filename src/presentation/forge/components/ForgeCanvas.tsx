import React from 'react'
import type { Scene } from '../../game/scene'
import {
  computeCellSize,
  computeOffset,
  cellCenter,
  type Point,
} from '../../rendering/boardLayout'

interface ForgeCanvasProps {
  scene: Scene
  gridCols: number
  gridRows: number
  selectedArrowId?: string | null
}

const BOARD_SIZE = 560
const BACKGROUND_COLOR = '#f5f5f5'
const GHOST_DOT_COLOR = '#999'
const GHOST_DOT_RADIUS_RATIO = 0.08

/**
 * ForgeCanvas — Lienzo SVG de edición del nivel.
 *
 * Fase 1 (read-only): muestra solo la grilla de slots fantasma.
 * Posteriormente se añadirán capas de celdas, conexiones, flechas, etc.
 */
export const ForgeCanvas: React.FC<ForgeCanvasProps> = ({
  scene,
  gridCols,
  gridRows,
  selectedArrowId,
}) => {
  // Layout del lienzo: bounding box fijo (gridCols × gridRows)
  const maxCol = gridCols - 1
  const maxRow = gridRows - 1
  const cellSize = computeCellSize(maxCol, maxRow, BOARD_SIZE, BOARD_SIZE)
  const offset = computeOffset(maxCol, maxRow, cellSize, BOARD_SIZE, BOARD_SIZE)

  // Genera posiciones de ghosts (todos los slots del bounding box)
  const ghostPositions: Point[] = []
  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col <= maxCol; col++) {
      const center = cellCenter(col, row, cellSize, offset)
      ghostPositions.push(center)
    }
  }

  const ghostRadius = GHOST_DOT_RADIUS_RATIO * cellSize

  return (
    <svg
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      style={{
        border: '1px solid #ccc',
        backgroundColor: BACKGROUND_COLOR,
        width: '100%',
        aspectRatio: '1',
      }}
      data-testid="forge-canvas"
    >
      {/* Capa 1: Fondo */}
      <rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill={BACKGROUND_COLOR} />

      {/* Capa 2: Ghosts (slots fantasma) */}
      {ghostPositions.map((pos, idx) => (
        <circle
          key={`ghost-${idx}`}
          cx={pos.x}
          cy={pos.y}
          r={ghostRadius}
          fill={GHOST_DOT_COLOR}
          opacity={0.25}
          data-testid="ghost-dot"
        />
      ))}

      {/* Capas futuras (3-6): conexiones, celdas, flechas, overlays */}
      {/* TODO: Fase 2+ */}
    </svg>
  )
}
