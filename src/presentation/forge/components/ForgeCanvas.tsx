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

/**
 * ForgeCanvas — Lienzo SVG de edición del nivel.
 *
 * En modo 3D (activeLayer >= 0) solo se muestran las celdas de la capa activa.
 * Las conexiones inter-capa (ports 4/5) se visualizan como línea punteada + badge ▲/▼.
 *
 * Capas:
 *  1. Fondo
 *  2. Ghosts (slots vacíos)
 *  3. Celdas (existentes en la capa activa)
 *  4. Conexiones normales + inter-capa
 *  4b. Puertos clicables (modo connect: 4 o 6 handles según portCount)
 *  5. Flechas (solo las cuya cabeza está en la capa activa)
 *  6. Overlays (selección, candidatas extend)
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

  // Layout del lienzo: bounding box fijo (gridCols × gridRows)
  const maxCol = gridCols - 1
  const maxRow = gridRows - 1
  const cellSize = computeCellSize(maxCol, maxRow, BOARD_SIZE, BOARD_SIZE)
  const offset = computeOffset(maxCol, maxRow, cellSize, BOARD_SIZE, BOARD_SIZE)

  const layout: BoardLayout = { maxCol, maxRow, cellSize, offset }

  // Solo celdas de la capa activa son visibles
  const visibleCells = scene.cells.filter((c) => (c.layer ?? 0) === activeLayer)
  const occupiedCells = new Set(visibleCells.map((c) => c.id))

  // Genera posiciones de ghosts (todos los slots del bounding box no ocupados en la capa activa)
  const ghostPositions: Point[] = []
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
  const tileSize = CELL_TILE_RATIO * cellSize
  const portDist = tileSize / 2

  // Posición en pixeles de un puerto de una celda
  const portPoint = (center: Point, port: number): Point => {
    const d = portDelta(port)
    return { x: center.x + d.dCol * portDist, y: center.y + d.dRow * portDist }
  }

  // Click en un puerto (solo modo connect). Lógica puerto-a-puerto.
  const handlePortClick = (cellId: string, port: number) => {
    const existing = sceneOps.portConnection(scene, cellId, port)

    if (!pendingConnect) {
      // Sin pendiente: si el puerto ya está conectado, desconectar; si no, marcar origen.
      if (existing) {
        disconnectPort(cellId, port)
      } else {
        setPendingConnect({ cellId, port })
      }
      return
    }

    // Hay un origen pendiente
    if (pendingConnect.cellId === cellId && pendingConnect.port === port) {
      // Click en el mismo puerto: cancelar
      setPendingConnect(null)
      return
    }

    if (existing) {
      // Destino ocupado: un puerto solo admite una conexión. Cancela la selección.
      setPendingConnect(null)
      return
    }

    // Crear conexión origen → destino (cualquier par de puertos, sin exigir opuestos)
    connectPorts(pendingConnect.cellId, pendingConnect.port, cellId, port)
    setPendingConnect(null)
  }

  // Manejo de clicks a nivel de celda (para tools que no son connect)
  const handleCellClick = (col: number, row: number) => {
    const cellId = sceneOps.cellIdAt(col, row)
    const cellExists = occupiedCells.has(cellId) // ¿hay una celda visible en este slot?
    const occupyingArrowId = sceneOps.occupiedBy(scene, cellId) // ¿la ocupa alguna flecha?

    if (tool === 'cell') {
      if (cellExists) {
        // Click en celda existente: eliminar (con confirm)
        if (window.confirm(`¿Eliminar celda ${cellId} (capa ${activeLayer}) y sus conexiones/flechas?`)) {
          removeCell(cellId)
        }
      } else {
        // Click en slot vacío: agregar celda en la capa activa con el portCount configurado
        addCell(col, row, activeLayer, portCountForNew)
      }
    } else if (tool === 'connect') {
      // En modo connect, los clicks en celda vacía cancelan la selección pendiente.
      if (pendingConnect) setPendingConnect(null)
    } else if (tool === 'arrowHead') {
      // Colocar cabeza requiere una celda existente en la capa activa y libre de flechas.
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

  // Flechas cuya celda-cabeza está en la capa activa
  const visibleArrows = scene.arrows.filter((a) =>
    visibleCells.some((c) => c.id === a.head.cellId),
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

      {/* Capa 3: Celdas (existentes en la capa activa) — tiles claros del tablero */}
      {visibleCells.map((cell) => {
        const center = cellCenter(cell.col, cell.row, cellSize, offset)
        const isConnectPending = tool === 'connect' && pendingConnect?.cellId === cell.id
        const is3DCell = cell.portCount === 6
        return (
          <g key={`cell-${cell.id}`} style={{ pointerEvents: 'auto' }}>
            {/* Tile de fondo */}
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
            {/* Etiqueta de id (esquina superior izquierda, tenue) */}
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
            {/* Badge 3D: indica que la celda tiene ports inter-capa */}
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

      {/* Capa 4: Conexiones — líneas puerto-a-puerto */}
      {scene.connections.map((conn, idx) => {
        const fromCell = visibleCells.find((c) => c.id === conn.fromCell)
        const toCell = visibleCells.find((c) => c.id === conn.toCell)

        const fromIsInterLayer = isInterLayerPort(conn.fromPort)
        const toIsInterLayer = isInterLayerPort(conn.toPort)

        // Conexión normal: ambas celdas en la capa activa y puertos planar
        if (fromCell && toCell && !fromIsInterLayer && !toIsInterLayer) {
          const fromCenter = cellCenter(fromCell.col, fromCell.row, cellSize, offset)
          const toCenter = cellCenter(toCell.col, toCell.row, cellSize, offset)
          const fromPort = portPoint(fromCenter, conn.fromPort)
          const toPort = portPoint(toCenter, conn.toPort)
          return (
            <g key={`connection-${idx}`}>
              <line
                x1={fromPort.x} y1={fromPort.y}
                x2={toPort.x} y2={toPort.y}
                stroke="#7c9cb5"
                strokeWidth={2.5}
                opacity={0.7}
                data-testid={`connection-${conn.fromCell}-${conn.toCell}`}
              />
              <circle cx={fromPort.x} cy={fromPort.y} r={3} fill="#5a7d99" />
              <circle cx={toPort.x} cy={toPort.y} r={3} fill="#5a7d99" />
            </g>
          )
        }

        // Conexión inter-capa desde la celda visible: línea punteada hacia la esquina + badge
        if (fromCell && fromIsInterLayer) {
          const fromCenter = cellCenter(fromCell.col, fromCell.row, cellSize, offset)
          const fromPort = portPoint(fromCenter, conn.fromPort)
          const label = conn.fromPort === 4 ? '▲' : '▼'
          return (
            <g key={`connection-${idx}`}>
              <line
                x1={fromCenter.x} y1={fromCenter.y}
                x2={fromPort.x} y2={fromPort.y}
                stroke={INTERLAYER_COLOR}
                strokeWidth={2}
                strokeDasharray="4,3"
                opacity={0.8}
              />
              <circle cx={fromPort.x} cy={fromPort.y} r={5} fill={INTERLAYER_COLOR} opacity={0.9} />
              <text
                x={fromPort.x}
                y={fromPort.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="#fff"
                pointerEvents="none"
              >
                {label}
              </text>
            </g>
          )
        }

        if (toCell && toIsInterLayer) {
          const toCenter = cellCenter(toCell.col, toCell.row, cellSize, offset)
          const toPort = portPoint(toCenter, conn.toPort)
          const label = conn.toPort === 4 ? '▲' : '▼'
          return (
            <g key={`connection-${idx}`}>
              <line
                x1={toCenter.x} y1={toCenter.y}
                x2={toPort.x} y2={toPort.y}
                stroke={INTERLAYER_COLOR}
                strokeWidth={2}
                strokeDasharray="4,3"
                opacity={0.8}
              />
              <circle cx={toPort.x} cy={toPort.y} r={5} fill={INTERLAYER_COLOR} opacity={0.9} />
              <text
                x={toPort.x}
                y={toPort.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="#fff"
                pointerEvents="none"
              >
                {label}
              </text>
            </g>
          )
        }

        return null
      })}

      {/* Capa 4b: Puertos clicables (solo en modo connect) */}
      {tool === 'connect' &&
        visibleCells.map((cell) => {
          const center = cellCenter(cell.col, cell.row, cellSize, offset)
          // 4 puertos para celdas 2D, 6 para celdas 3D
          const portIndices = Array.from({ length: cell.portCount }, (_, i) => i)
          return portIndices.map((port) => {
            const pt = portPoint(center, port)
            const isConnected = sceneOps.portConnection(scene, cell.id, port) !== null
            const isPending = pendingConnect?.cellId === cell.id && pendingConnect?.port === port
            const isIL = isInterLayerPort(port)
            const fill = isPending ? '#ff6b6b' : isConnected ? (isIL ? INTERLAYER_COLOR : '#5a7d99') : '#fff'
            const portLabel = port === 4 ? '▲' : port === 5 ? '▼' : null
            return (
              <g key={`port-${cell.id}-${port}`}>
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

      {/* Capa 5: Flechas — solo las cuya cabeza está en la capa activa */}
      {visibleArrows.length > 0 && (
        <g data-testid="arrows-layer">
          {visibleArrows.map((arrow, arrowIndex) => {
            const headCell = visibleCells.find((c) => c.id === arrow.head.cellId)
            if (!headCell) {
              console.warn(
                `[ForgeCanvas] Arrow ${arrow.id} head cell not found: ${arrow.head.cellId}`,
              )
              return null
            }

            const headCenter = cellCenter(headCell.col, headCell.row, cellSize, offset)
            const centers: Point[] = [headCenter]
            for (const bodyId of arrow.body) {
              const bodyCell = visibleCells.find((c) => c.id === bodyId)
              if (!bodyCell) {
                // Segmento en otra capa: se omite en esta vista
                continue
              }
              centers.push(cellCenter(bodyCell.col, bodyCell.row, cellSize, offset))
            }

            const color = DEFAULT_ARROW_PALETTE[arrowIndex % DEFAULT_ARROW_PALETTE.length]
            const isSelected = arrow.id === selectedArrowId
            const bodyWidth = tileSize * 0.32
            const nodeRadius = tileSize * 0.28
            const tipCenter = centers[centers.length - 1]

            // Dirección de la punta
            let tipDir: { dCol: number; dRow: number }
            if (centers.length > 1) {
              const prev = centers[centers.length - 2]
              const dx = tipCenter.x - prev.x
              const dy = tipCenter.y - prev.y
              const len = Math.hypot(dx, dy) || 1
              tipDir = { dCol: dx / len, dRow: dy / len }
            } else {
              const rawDir = portDelta(arrow.head.exitPort)
              // Para ports inter-capa, usar una dirección neutra (arriba) como fallback visual
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
              <g key={`arrow-${arrow.id}`} pointerEvents="none">
                {/* Halo de selección */}
                {isSelected &&
                  centers.map((p, i) => (
                    <circle
                      key={`halo-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={nodeRadius + 5}
                      fill="none"
                      stroke="#ff6b6b"
                      strokeWidth={3}
                      opacity={0.7}
                    />
                  ))}

                {/* Cuerpo: línea gruesa por los centros */}
                {centers.length > 1 && (
                  <polyline
                    points={centers.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth={bodyWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.95}
                  />
                )}

                {/* Nodo en cada celda ocupada */}
                {centers.map((p, i) => (
                  <circle
                    key={`node-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={nodeRadius}
                    fill={color}
                    opacity={0.95}
                  />
                ))}

                {/* Marca de la cabeza (aro blanco en la celda trasera = origen) */}
                <circle
                  cx={headCenter.x}
                  cy={headCenter.y}
                  r={nodeRadius * 0.5}
                  fill="#fff"
                  opacity={0.95}
                />

                {/* Marcador del exitPort */}
                <line
                  x1={headCenter.x}
                  y1={headCenter.y}
                  x2={exitMarkX}
                  y2={exitMarkY}
                  stroke="#fff"
                  strokeWidth={3}
                  opacity={0.95}
                />

                {/* Punta triangular */}
                <polygon
                  points={`${apexX},${apexY} ${b1X},${b1Y} ${b2X},${b2Y}`}
                  fill={color}
                  opacity={0.95}
                />
              </g>
            )
          })}
        </g>
      )}

      {/* Capa 6: Overlays */}
      {/* Candidatas en modo extend */}
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
            // Solo candidatas en la capa activa
            const candCell = visibleCells.find((c) => c.id === candCellId)
            if (candCell) {
              const center = cellCenter(candCell.col, candCell.row, cellSize, offset)
              candidates.push(center)
            }
          }

          return candidates.map((pos, idx) => (
            <circle
              key={`candidate-${idx}`}
              cx={pos.x}
              cy={pos.y}
              r={tileSize * 0.5}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={4}
              opacity={0.9}
              pointerEvents="none"
              data-testid={`extend-candidate-${idx}`}
            />
          ))
        })()}
    </svg>
  )
}
