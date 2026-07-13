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
  isInterLayerPort,
  type Point,
  type BoardLayout,
} from '../../rendering/boardLayout'
import { useForgeInput } from '../input/useForgeInput'

interface ForgeCanvasProps {
  scene: Scene
  gridCols: number
  gridRows: number
  selectedArrowId?: string | null
  activeLayer: number
  portCountForNew?: number
}

const BOARD_SIZE = 560
const BACKGROUND_COLOR = '#f5f5f5'
const GHOST_DOT_COLOR = '#ddd'
const GHOST_DOT_RADIUS_RATIO = 0.12
// Celdas: tiles claros (el tablero). Las flechas se dibujan encima con color.
const CELL_TILE_RATIO = 0.72 // lado del tile como fracción de cellSize
const CELL_TILE_FILL = '#e8e8e8'
const CELL_TILE_STROKE = '#bbb'
const CELL_TILE_STROKE_SELECTED = '#ff6b6b'
const INTERLAYER_COLOR = '#a855f7'  // violeta para conexiones inter-capa

const layerVisualOffset = (layer: number, activeLayer: number): Point => ({
  x: (layer - activeLayer) * 50,
  y: -(layer - activeLayer) * 50,
})

/**
 * ForgeCanvas — Lienzo SVG de edición del nivel en modo cascada (3D).
 *
 * Muestra la capa activa y las adyacentes (Z-1 y Z+1) con un desplazamiento
 * isométrico. Las interacciones en el canvas base actúan sobre la capa activa.
 * Los puertos de todas las capas visibles son clicables para permitir trazar
 * conexiones 3D de forma cruzada.
 */
export const ForgeCanvas: React.FC<ForgeCanvasProps> = ({
  scene,
  gridCols,
  gridRows,
  selectedArrowId,
  activeLayer,
  portCountForNew = 4,
}) => {
  const canvasRef = useRef<SVGSVGElement>(null)
  const tool = useForgeStore((s) => s.tool)
  const addCell = useForgeStore((s) => s.addCell)
  const removeCell = useForgeStore((s) => s.removeCell)
  const connectPorts = useForgeStore((s) => s.connectPorts)
  const disconnectPort = useForgeStore((s) => s.disconnectPort)
  const setPendingConnect = useForgeStore((s) => s.setPendingConnect)
  const pendingConnect = useForgeStore((s) => s.pendingConnect)
  const placeHead = useForgeStore((s) => s.placeHead)
  const selectArrow = useForgeStore((s) => s.selectArrow)
  const extendArrow = useForgeStore((s) => s.extendArrow)
  const deleteArrow = useForgeStore((s) => s.deleteArrow)

  const maxCol = gridCols - 1
  const maxRow = gridRows - 1
  const cellSize = computeCellSize(maxCol, maxRow, BOARD_SIZE, BOARD_SIZE)
  const offset = computeOffset(maxCol, maxRow, cellSize, BOARD_SIZE, BOARD_SIZE)

  const layout: BoardLayout = { maxCol, maxRow, cellSize, offset }

  const getCellCenter = (col: number, row: number, layer: number): Point => {
    const base = cellCenter(col, row, cellSize, offset)
    const shift = layerVisualOffset(layer, activeLayer)
    return { x: base.x + shift.x, y: base.y + shift.y }
  }

  // Visibilidad 3D: capa activa y adyacentes, ordenadas de atrás hacia adelante (Z)
  const visibleCells = scene.cells
    .filter((c) => Math.abs((c.layer ?? 0) - activeLayer) <= 1)
    .sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0))

  // Celdas ocupadas SOLO en la capa activa (para interacciones del canvas)
  const activeOccupiedCells = new Set(
    scene.cells.filter((c) => (c.layer ?? 0) === activeLayer).map((c) => c.id)
  )

  const ghostPositions: Point[] = []
  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col <= maxCol; col++) {
      const cellId = sceneOps.cellIdAt(col, row)
      if (!activeOccupiedCells.has(cellId)) {
        ghostPositions.push(getCellCenter(col, row, activeLayer))
      }
    }
  }

  const ghostRadius = GHOST_DOT_RADIUS_RATIO * cellSize
  const tileSize = CELL_TILE_RATIO * cellSize
  const portDist = tileSize / 2

  const portPoint = (center: Point, port: number): Point => {
    const d = portDelta(port)
    return { x: center.x + d.dCol * portDist, y: center.y + d.dRow * portDist }
  }

  const handlePortClick = (cellId: string, port: number) => {
    const existing = sceneOps.portConnection(scene, cellId, port)

    if (!pendingConnect) {
      if (existing) {
        disconnectPort(cellId, port)
      } else {
        setPendingConnect({ cellId, port })
      }
      return
    }

    if (pendingConnect.cellId === cellId && pendingConnect.port === port) {
      setPendingConnect(null)
      return
    }

    if (existing) {
      setPendingConnect(null)
      return
    }

    connectPorts(pendingConnect.cellId, pendingConnect.port, cellId, port)
    setPendingConnect(null)
  }

  const handleCellClick = (col: number, row: number) => {
    const cellId = sceneOps.cellIdAt(col, row)
    const cellExists = activeOccupiedCells.has(cellId)
    const occupyingArrowId = sceneOps.occupiedBy(scene, cellId)

    if (tool === 'cell') {
      if (cellExists) {
        if (window.confirm(`¿Eliminar celda ${cellId} (capa ${activeLayer}) y sus conexiones/flechas?`)) {
          removeCell(cellId)
        }
      } else {
        addCell(col, row, activeLayer, portCountForNew)
      }
    } else if (tool === 'connect') {
      if (pendingConnect) setPendingConnect(null)
    } else if (tool === 'arrowHead') {
      if (cellExists && !occupyingArrowId) {
        const newId = sceneOps.nextArrowId(scene)
        placeHead(cellId)
        selectArrow(newId)
      }
    } else if (tool === 'extend') {
      if (occupyingArrowId) {
        selectArrow(occupyingArrowId)
      } else if (selectedArrowId) {
        extendArrow(selectedArrowId, cellId)
      }
    } else if (tool === 'erase') {
      if (occupyingArrowId) {
        deleteArrow(occupyingArrowId)
      }
    } else if (tool === 'select') {
      if (occupyingArrowId) {
        selectArrow(occupyingArrowId)
      } else {
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

  // Solo flechas que tengan al menos una celda visible en Z±1
  const visibleArrows = scene.arrows.filter((a) =>
    visibleCells.some((c) => c.id === a.head.cellId || a.body.includes(c.id))
  )

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
      <rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill={BACKGROUND_COLOR} />

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

      {visibleCells.map((cell) => {
        const layer = cell.layer ?? 0
        const isActive = layer === activeLayer
        const center = getCellCenter(cell.col, cell.row, layer)
        const isConnectPending = tool === 'connect' && pendingConnect?.cellId === cell.id
        const is3DCell = cell.portCount === 6

        return (
          <g key={`cell-${cell.id}`} style={{ pointerEvents: isActive ? 'auto' : 'none', opacity: isActive ? 1.0 : 0.4 }}>
            <rect
              x={center.x - tileSize / 2}
              y={center.y - tileSize / 2}
              width={tileSize}
              height={tileSize}
              fill={CELL_TILE_FILL}
              stroke={isConnectPending ? CELL_TILE_STROKE_SELECTED : CELL_TILE_STROKE}
              strokeWidth={isConnectPending ? 3 : 1.5}
              rx={4}
            />
            <text
              x={center.x - tileSize / 2 + 4}
              y={center.y - tileSize / 2 + 4}
              textAnchor="start"
              dominantBaseline="hanging"
              fontSize="9"
              fill="#999"
              pointerEvents="none"
              data-testid={`cell-${cell.id}`}
            >
              {cell.id}
            </text>
            {is3DCell && (
              <text
                x={center.x + tileSize / 2 - 4}
                y={center.y - tileSize / 2 + 4}
                textAnchor="end"
                dominantBaseline="hanging"
                fontSize="9"
                fill={INTERLAYER_COLOR}
                pointerEvents="none"
              >
                3D
              </text>
            )}
          </g>
        )
      })}

      {scene.connections.map((conn, idx) => {
        const fromCell = visibleCells.find((c) => c.id === conn.fromCell)
        const toCell = visibleCells.find((c) => c.id === conn.toCell)

        if (!fromCell) return null

        const fromIsInterLayer = isInterLayerPort(conn.fromPort)
        const toIsInterLayer = isInterLayerPort(conn.toPort)

        const fromCenter = getCellCenter(fromCell.col, fromCell.row, fromCell.layer ?? 0)
        const fromPortPoint = portPoint(fromCenter, conn.fromPort)

        if (toCell) {
          const toCenter = getCellCenter(toCell.col, toCell.row, toCell.layer ?? 0)
          const toPortPoint = portPoint(toCenter, conn.toPort)
          
          if (fromIsInterLayer || toIsInterLayer) {
            return (
               <g key={`connection-${idx}`}>
                 <line
                   x1={fromPortPoint.x} y1={fromPortPoint.y}
                   x2={toPortPoint.x} y2={toPortPoint.y}
                   stroke={INTERLAYER_COLOR}
                   strokeWidth={2}
                   strokeDasharray="4,3"
                   opacity={0.8}
                 />
                 <circle cx={fromPortPoint.x} cy={fromPortPoint.y} r={5} fill={INTERLAYER_COLOR} opacity={0.9} />
                 <circle cx={toPortPoint.x} cy={toPortPoint.y} r={5} fill={INTERLAYER_COLOR} opacity={0.9} />
               </g>
            )
          } else {
             const isActive = (fromCell.layer ?? 0) === activeLayer && (toCell.layer ?? 0) === activeLayer
             return (
               <g key={`connection-${idx}`} opacity={isActive ? 1.0 : 0.4}>
                 <line
                   x1={fromPortPoint.x} y1={fromPortPoint.y}
                   x2={toPortPoint.x} y2={toPortPoint.y}
                   stroke="#7c9cb5"
                   strokeWidth={2.5}
                   opacity={0.7}
                   data-testid={`connection-${conn.fromCell}-${conn.toCell}`}
                 />
                 <circle cx={fromPortPoint.x} cy={fromPortPoint.y} r={3} fill="#5a7d99" />
                 <circle cx={toPortPoint.x} cy={toPortPoint.y} r={3} fill="#5a7d99" />
               </g>
             )
          }
        }

        if (fromIsInterLayer) {
          const label = conn.fromPort === 4 ? '▲' : '▼'
          return (
            <g key={`connection-${idx}`}>
              <line
                x1={fromCenter.x} y1={fromCenter.y}
                x2={fromPortPoint.x} y2={fromPortPoint.y}
                stroke={INTERLAYER_COLOR}
                strokeWidth={2}
                strokeDasharray="4,3"
                opacity={0.8}
              />
              <circle cx={fromPortPoint.x} cy={fromPortPoint.y} r={5} fill={INTERLAYER_COLOR} opacity={0.9} />
              <text x={fromPortPoint.x} y={fromPortPoint.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#fff" pointerEvents="none">
                {label}
              </text>
            </g>
          )
        }
        return null
      })}

      {tool === 'connect' &&
        visibleCells.map((cell) => {
          const layer = cell.layer ?? 0
          const isActive = layer === activeLayer
          const center = getCellCenter(cell.col, cell.row, layer)
          const portIndices = Array.from({ length: cell.portCount }, (_, i) => i)

          return portIndices.map((port) => {
            const pt = portPoint(center, port)
            const isConnected = sceneOps.portConnection(scene, cell.id, port) !== null
            const isPending = pendingConnect?.cellId === cell.id && pendingConnect?.port === port
            const isIL = isInterLayerPort(port)
            const fill = isPending ? '#ff6b6b' : isConnected ? (isIL ? INTERLAYER_COLOR : '#5a7d99') : '#fff'
            const portLabel = port === 4 ? '▲' : port === 5 ? '▼' : null

            return (
              <g key={`port-${cell.id}-${port}`} style={{ opacity: isActive || isIL ? 1.0 : 0.4 }}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isIL ? 8 : 7}
                  fill={fill}
                  stroke={isIL ? INTERLAYER_COLOR : '#333'}
                  strokeWidth={1.5}
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    handlePortClick(cell.id, port)
                  }}
                  data-testid={`port-${cell.id}-${port}`}
                />
                {portLabel && (
                  <text
                    x={pt.x}
                    y={pt.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fill={isPending ? '#fff' : INTERLAYER_COLOR}
                    pointerEvents="none"
                  >
                    {portLabel}
                  </text>
                )}
              </g>
            )
          })
        })}

      {visibleArrows.length > 0 && (
        <g data-testid="arrows-layer">
          {visibleArrows.map((arrow, arrowIndex) => {
            const headCell = scene.cells.find((c) => c.id === arrow.head.cellId)
            if (!headCell) return null

            const headLayer = headCell.layer ?? 0
            const isVisible = Math.abs(headLayer - activeLayer) <= 1
            if (!isVisible) return null

            const isActive = headLayer === activeLayer
            const headCenter = getCellCenter(headCell.col, headCell.row, headLayer)
            const centers: Point[] = [headCenter]

            for (const bodyId of arrow.body) {
              const bodyCell = scene.cells.find((c) => c.id === bodyId)
              if (!bodyCell || Math.abs((bodyCell.layer ?? 0) - activeLayer) > 1) continue
              centers.push(getCellCenter(bodyCell.col, bodyCell.row, bodyCell.layer ?? 0))
            }

            const color = DEFAULT_ARROW_PALETTE[arrowIndex % DEFAULT_ARROW_PALETTE.length]
            const isSelected = arrow.id === selectedArrowId
            const bodyWidth = tileSize * 0.32
            const nodeRadius = tileSize * 0.28
            const tipCenter = centers[centers.length - 1]

            let tipDir: { dCol: number; dRow: number }
            if (centers.length > 1) {
              const prev = centers[centers.length - 2]
              const dx = tipCenter.x - prev.x
              const dy = tipCenter.y - prev.y
              const len = Math.hypot(dx, dy) || 1
              tipDir = { dCol: dx / len, dRow: dy / len }
            } else {
              const rawDir = portDelta(arrow.head.exitPort)
              tipDir = isInterLayerPort(arrow.head.exitPort)
                ? { dCol: 0, dRow: -1 }
                : rawDir
            }

            const tipLen = tileSize * 0.4
            const tipHalf = tileSize * 0.28
            const perpX = -tipDir.dRow
            const perpY = tipDir.dCol
            const apexX = tipCenter.x + tipDir.dCol * tipLen
            const apexY = tipCenter.y + tipDir.dRow * tipLen
            const b1X = tipCenter.x + perpX * tipHalf
            const b1Y = tipCenter.y + perpY * tipHalf
            const b2X = tipCenter.x - perpX * tipHalf
            const b2Y = tipCenter.y - perpY * tipHalf

            const exitDelta = portDelta(arrow.head.exitPort)
            const exitDir = isInterLayerPort(arrow.head.exitPort)
              ? { dCol: 0, dRow: -1 }
              : exitDelta
            const exitMarkX = headCenter.x + exitDir.dCol * (nodeRadius + 4)
            const exitMarkY = headCenter.y + exitDir.dRow * (nodeRadius + 4)

            return (
              <g key={`arrow-${arrow.id}`} pointerEvents="none" style={{ opacity: isActive ? 1.0 : 0.4 }}>
                {isSelected &&
                  centers.map((p, i) => (
                    <circle
                      key={`halo-${i}`}
                      cx={p.x} cy={p.y} r={nodeRadius + 5}
                      fill="none" stroke="#ff6b6b" strokeWidth={3} opacity={0.7}
                    />
                  ))}

                {centers.length > 1 && (
                  <polyline
                    points={centers.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke={color} strokeWidth={bodyWidth}
                    strokeLinejoin="round" strokeLinecap="round" opacity={0.95}
                  />
                )}

                {centers.map((p, i) => (
                  <circle key={`node-${i}`} cx={p.x} cy={p.y} r={nodeRadius} fill={color} opacity={0.95} />
                ))}

                <circle cx={headCenter.x} cy={headCenter.y} r={nodeRadius * 0.5} fill="#fff" opacity={0.95} />

                <line
                  x1={headCenter.x} y1={headCenter.y}
                  x2={exitMarkX} y2={exitMarkY}
                  stroke="#fff" strokeWidth={3} opacity={0.95}
                />

                <polygon
                  points={`${apexX},${apexY} ${b1X},${b1Y} ${b2X},${b2Y}`}
                  fill={color} opacity={0.95}
                />
              </g>
            )
          })}
        </g>
      )}

      {tool === 'extend' &&
        (() => {
          const selectedArrow = scene.arrows.find((a) => a.id === selectedArrowId)
          if (!selectedArrow) return null

          const lastCellId = sceneOps.lastCellOf(selectedArrow)
          const candidates: Point[] = []
          const candidateCellIds = new Set<string>()

          for (const conn of scene.connections) {
            if (conn.fromCell === lastCellId) candidateCellIds.add(conn.toCell)
            if (conn.toCell === lastCellId) candidateCellIds.add(conn.fromCell)
          }

          for (const candCellId of candidateCellIds) {
            if (candCellId === lastCellId) continue
            const occupyingArrow = sceneOps.occupiedBy(scene, candCellId)
            if (occupyingArrow && occupyingArrow !== selectedArrow.id) continue
            
            const candCell = activeOccupiedCells.has(candCellId) ? scene.cells.find(c => c.id === candCellId) : null
            if (candCell) {
              candidates.push(getCellCenter(candCell.col, candCell.row, activeLayer))
            }
          }

          return candidates.map((pos, idx) => (
            <circle
              key={`candidate-${idx}`}
              cx={pos.x} cy={pos.y} r={tileSize * 0.5}
              fill="none" stroke="#fbbf24" strokeWidth={4} opacity={0.9}
              pointerEvents="none"
              data-testid={`extend-candidate-${idx}`}
            />
          ))
        })()}
    </svg>
  )
}
