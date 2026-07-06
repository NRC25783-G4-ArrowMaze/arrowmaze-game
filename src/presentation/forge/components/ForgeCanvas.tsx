import React, { useRef } from 'react'
import { useForgeStore } from '../state/forgeStore'
import * as sceneOps from '../state/sceneOps'
import type { Scene } from '../../game/scene'
import { DEFAULT_ARROW_PALETTE } from '../../game/scene'
import {
  computeCellSize,
  computeOffset,
  cellCenter,
  portDelta,
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
const ARROW_BODY_STROKE_WIDTH = 2
const ARROW_HEAD_INDICATOR_LENGTH = 8

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
  const placeHead = useForgeStore((s) => s.placeHead)
  const selectArrow = useForgeStore((s) => s.selectArrow)
  const extendArrow = useForgeStore((s) => s.extendArrow)
  const deleteArrow = useForgeStore((s) => s.deleteArrow)

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
    const occupyingArrowId = sceneOps.occupiedBy(scene, cellId)

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
    } else if (tool === 'arrowHead') {
      if (!isCellOccupied) {
        // Click en celda libre: colocar cabeza de flecha
        placeHead(cellId)
      }
    } else if (tool === 'extend') {
      if (occupyingArrowId) {
        // Click en celda ocupada: seleccionar la flecha
        selectArrow(occupyingArrowId)
      } else if (selectedArrowId) {
        // Click en candidata: extender
        extendArrow(selectedArrowId, cellId)
      }
    } else if (tool === 'erase') {
      if (occupyingArrowId) {
        // Click en flecha: eliminarla
        deleteArrow(occupyingArrowId)
      }
    } else if (tool === 'select') {
      if (occupyingArrowId) {
        // Click en flecha: seleccionarla
        selectArrow(occupyingArrowId)
      } else {
        // Click en vacío: deseleccionar
        selectArrow(null)
      }
    }
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

      {/* Capa 5: Flechas */}
      {scene.arrows.map((arrow, arrowIndex) => {
        const headCell = scene.cells.find((c) => c.id === arrow.head.cellId)
        if (!headCell) return null

        const centers: Point[] = [cellCenter(headCell.col, headCell.row, cellSize, offset)]
        for (const bodyId of arrow.body) {
          const bodyCell = scene.cells.find((c) => c.id === bodyId)
          if (bodyCell) {
            centers.push(cellCenter(bodyCell.col, bodyCell.row, cellSize, offset))
          }
        }

        const color = DEFAULT_ARROW_PALETTE[arrowIndex % DEFAULT_ARROW_PALETTE.length]
        const isSelected = arrow.id === selectedArrowId
        const strokeWidth = isSelected ? 3 : ARROW_BODY_STROKE_WIDTH
        const strokeColor = isSelected ? '#ff6b6b' : color

        return (
          <g key={`arrow-${arrow.id}`}>
            {/* Líneas conectando centros */}
            {centers.length > 1 &&
              centers.map((point, i) => {
                if (i === 0) return null
                const prev = centers[i - 1]
                return (
                  <line
                    key={`arrow-${arrow.id}-segment-${i}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={point.x}
                    y2={point.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    opacity={0.8}
                    pointerEvents="none"
                  />
                )
              })}

            {/* Indicador de exitPort (línea pequeña desde cabeza en dirección) */}
            {(() => {
              const delta = portDelta(arrow.head.exitPort)
              const headCenter = centers[0]
              const indicatorLen = ARROW_HEAD_INDICATOR_LENGTH
              return (
                <line
                  key={`arrow-${arrow.id}-direction`}
                  x1={headCenter.x}
                  y1={headCenter.y}
                  x2={headCenter.x + delta.dCol * indicatorLen}
                  y2={headCenter.y + delta.dRow * indicatorLen}
                  stroke={strokeColor}
                  strokeWidth={2}
                  opacity={0.6}
                  pointerEvents="none"
                />
              )
            })()}

            {/* Punta (triángulo) en última celda */}
            {centers.length > 0 && (() => {
              const tipPoint = centers[centers.length - 1]
              const delta = portDelta(arrow.head.exitPort)
              const tipSize = 6
              // Triángulo orientado según exitPort
              const baseX = tipPoint.x - delta.dCol * tipSize
              const baseY = tipPoint.y - delta.dRow * tipSize
              const perpX = -delta.dRow // perpendicular al delta
              const perpY = delta.dCol

              const p1 = `${tipPoint.x},${tipPoint.y}`
              const p2 = `${baseX + perpX * (tipSize / 2)},${baseY + perpY * (tipSize / 2)}`
              const p3 = `${baseX - perpX * (tipSize / 2)},${baseY - perpY * (tipSize / 2)}`

              return (
                <polygon
                  key={`arrow-${arrow.id}-tip`}
                  points={`${p1} ${p2} ${p3}`}
                  fill={strokeColor}
                  opacity={0.8}
                  pointerEvents="none"
                />
              )
            })()}
          </g>
        )
      })}

      {/* Capa 6: Overlays */}
      {/* Candidatas en modo extend */}
      {tool === 'extend' &&
        (() => {
          const selectedArrow = scene.arrows.find((a) => a.id === selectedArrowId)
          if (!selectedArrow) return null

          const lastCellId = sceneOps.lastCellOf(selectedArrow)
          const lastCell = scene.cells.find((c) => c.id === lastCellId)
          if (!lastCell) return null

          const candidates: Point[] = []
          for (let row = 0; row <= maxRow; row++) {
            for (let col = 0; col <= maxCol; col++) {
              const candCellId = sceneOps.cellIdAt(col, row)
              if (candCellId === lastCellId) continue // No la misma
              if (occupiedCells.has(candCellId) && sceneOps.occupiedBy(scene, candCellId) !== selectedArrow.id)
                continue // Ocupada por otro

              // Verificar si es candidata (adyacente + conectada + libre)
              const result = sceneOps.extendArrow(scene, selectedArrow.id, candCellId)
              if (result) {
                // Es válida
                const center = cellCenter(col, row, cellSize, offset)
                candidates.push(center)
              }
            }
          }

          return candidates.map((pos, idx) => (
            <circle
              key={`candidate-${idx}`}
              cx={pos.x}
              cy={pos.y}
              r={cellRadius * 0.6}
              fill="none"
              stroke="#fff700"
              strokeWidth={2}
              opacity={0.6}
              pointerEvents="none"
              data-testid={`extend-candidate-${idx}`}
            />
          ))
        })()}
    </svg>
  )
}
