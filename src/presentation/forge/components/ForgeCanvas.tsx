import React, { useRef } from 'react'
import { useForgeStore } from '../state/forgeStore'
import * as sceneOps from '../state/sceneOps'
import type { Scene } from '../../game/scene'
import {
  computeCellSize,
  computeOffset,
  cellCenter,
  type Point,
  type BoardLayout,
} from '../../rendering/boardLayout'
import { useForgeInput } from '../input/useForgeInput'

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
const CELL_DOT_COLOR = '#333'
const CELL_DOT_RADIUS_RATIO = 0.12

/**
 * ForgeCanvas — Lienzo SVG de edición del nivel.
 *
 * Fase 2: renderiza celdas existentes y ghosts para colocar nuevas.
 * Capas:
 *  1. Fondo
 *  2. Ghosts (slots vacíos)
 *  3. Celdas (existentes)
 *  4. Conexiones (TODO: Fase 2+)
 *  5. Flechas (TODO: Fase 3+)
 *  6. Overlays (selección, etc.)
 */
export const ForgeCanvas: React.FC<ForgeCanvasProps> = ({
  scene,
  gridCols,
  gridRows,
  selectedArrowId,
}) => {
  const canvasRef = useRef<SVGSVGElement>(null)
  const tool = useForgeStore((s) => s.tool)
  const addCell = useForgeStore((s) => s.addCell)
  const removeCell = useForgeStore((s) => s.removeCell)
  const toggleConnection = useForgeStore((s) => s.toggleConnection)
  const setPendingConnectFrom = useForgeStore((s) => s.setPendingConnectFrom)
  const pendingConnectFrom = useForgeStore((s) => s.pendingConnectFrom)

  // Layout del lienzo: bounding box fijo (gridCols × gridRows)
  const maxCol = gridCols - 1
  const maxRow = gridRows - 1
  const cellSize = computeCellSize(maxCol, maxRow, BOARD_SIZE, BOARD_SIZE)
  const offset = computeOffset(maxCol, maxRow, cellSize, BOARD_SIZE, BOARD_SIZE)

  const layout: BoardLayout = { maxCol, maxRow, cellSize, offset }

  // Genera posiciones de ghosts (todos los slots del bounding box)
  const ghostPositions: Point[] = []
  const occupiedCells = new Set(scene.cells.map((c) => c.id))

  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col <= maxCol; col++) {
      const cellId = sceneOps.cellIdAt(col, row)
      if (!occupiedCells.has(cellId)) {
        const center = cellCenter(col, row, cellSize, offset)
        ghostPositions.push(center)
      }
    }
  }

  const ghostRadius = GHOST_DOT_RADIUS_RATIO * cellSize
  const cellRadius = CELL_DOT_RADIUS_RATIO * cellSize

  // Manejo de clicks
  const handleCellClick = (col: number, row: number) => {
    const cellId = sceneOps.cellIdAt(col, row)
    const isCellOccupied = occupiedCells.has(cellId)

    if (tool === 'cell') {
      if (isCellOccupied) {
        // Click en celda existente: eliminar (con confirm)
        if (window.confirm(`¿Eliminar celda ${cellId} y sus conexiones/flechas?`)) {
          removeCell(cellId)
        }
      } else {
        // Click en slot vacío: agregar celda
        addCell(col, row)
      }
    } else if (tool === 'connect') {
      if (isCellOccupied) {
        if (!pendingConnectFrom) {
          // Primer click: marcar este como origen
          setPendingConnectFrom(cellId)
        } else if (pendingConnectFrom === cellId) {
          // Click en el mismo: cancelar
          setPendingConnectFrom(null)
        } else {
          // Segundo click: intentar conectar
          toggleConnection(pendingConnectFrom, cellId)
          setPendingConnectFrom(null)
        }
      }
    }
    // TODO: Fases 3+ para arrowHead, extend, erase, etc.
  }

  const onCanvasClick = useForgeInput({
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    layout,
    enabled: true,
    onCellClick: handleCellClick,
  })

  return (
    <svg
      ref={canvasRef}
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      onPointerDown={onCanvasClick}
      style={{
        border: '1px solid #ccc',
        backgroundColor: BACKGROUND_COLOR,
        width: '100%',
        aspectRatio: '1',
        cursor: tool === 'cell' ? 'crosshair' : 'pointer',
      }}
      data-testid="forge-canvas"
    >
      {/* Capa 1: Fondo */}
      <rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill={BACKGROUND_COLOR} />

      {/* Capa 2: Ghosts (slots fantasma, solo en modo cell) */}
      {tool === 'cell' &&
        ghostPositions.map((pos, idx) => (
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

      {/* Capa 3: Celdas (existentes) */}
      {scene.cells.map((cell) => {
        const center = cellCenter(cell.col, cell.row, cellSize, offset)
        const isHighlighted =
          tool === 'connect' && (pendingConnectFrom === cell.id || pendingConnectFrom !== null)
        return (
          <circle
            key={`cell-${cell.id}`}
            cx={center.x}
            cy={center.y}
            r={cellRadius}
            fill={isHighlighted ? '#ff6b6b' : CELL_DOT_COLOR}
            opacity={isHighlighted ? 0.8 : 1}
            style={{ pointerEvents: 'auto' }}
            data-testid={`cell-${cell.id}`}
          />
        )
      })}

      {/* Capa 4: Conexiones (TODO: Fase 2+) */}
      {/* Líneas entre celdas conectadas */}
      {scene.connections.map((conn, idx) => {
        const fromCell = scene.cells.find((c) => c.id === conn.fromCell)
        const toCell = scene.cells.find((c) => c.id === conn.toCell)
        if (!fromCell || !toCell) return null

        const fromCenter = cellCenter(fromCell.col, fromCell.row, cellSize, offset)
        const toCenter = cellCenter(toCell.col, toCell.row, cellSize, offset)

        return (
          <line
            key={`connection-${idx}`}
            x1={fromCenter.x}
            y1={fromCenter.y}
            x2={toCenter.x}
            y2={toCenter.y}
            stroke="#aaa"
            strokeWidth={2}
            opacity={0.5}
            data-testid={`connection-${conn.fromCell}-${conn.toCell}`}
          />
        )
      })}

      {/* Capas 5-6: Flechas y overlays (TODO: Fase 3+) */}
    </svg>
  )
}
