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
const GHOST_DOT_COLOR = '#ddd'
const GHOST_DOT_RADIUS_RATIO = 0.12
// Celdas: tiles claros (el tablero). Las flechas se dibujan encima con color.
const CELL_TILE_RATIO = 0.72 // lado del tile como fracción de cellSize
const CELL_TILE_FILL = '#e8e8e8'
const CELL_TILE_STROKE = '#bbb'
const CELL_TILE_STROKE_SELECTED = '#ff6b6b'

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
  const tileSize = CELL_TILE_RATIO * cellSize
  const portDist = tileSize / 2

  // Posición en pixeles de un puerto de una celda (centro del tile + delta del puerto)
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
    const cellExists = occupiedCells.has(cellId) // ¿hay una celda del tablero en este slot?
    const occupyingArrowId = sceneOps.occupiedBy(scene, cellId) // ¿la ocupa alguna flecha?

    if (tool === 'cell') {
      if (cellExists) {
        // Click en celda existente: eliminar (con confirm)
        if (window.confirm(`¿Eliminar celda ${cellId} y sus conexiones/flechas?`)) {
          removeCell(cellId)
        }
      } else {
        // Click en slot vacío: agregar celda
        addCell(col, row)
      }
    } else if (tool === 'connect') {
      // En modo connect, los clicks en celda vacía cancelan la selección pendiente.
      // (Los clicks en puertos los maneja handlePortClick vía sus propios elementos.)
      if (pendingConnect) setPendingConnect(null)
    } else if (tool === 'arrowHead') {
      // Colocar cabeza requiere una celda existente y libre de flechas.
      if (cellExists && !occupyingArrowId) {
        const newId = sceneOps.nextArrowId(scene) // id que recibirá la nueva flecha
        placeHead(cellId)
        selectArrow(newId) // auto-seleccionar para feedback + rotar con R
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

      {/* Capa 3: Celdas (existentes) — tiles claros del tablero */}
      {scene.cells.map((cell) => {
        const center = cellCenter(cell.col, cell.row, cellSize, offset)
        const isConnectPending = tool === 'connect' && pendingConnect?.cellId === cell.id
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
          </g>
        )
      })}

      {/* Capa 4: Conexiones — líneas puerto-a-puerto */}
      {scene.connections.map((conn, idx) => {
        const fromCell = scene.cells.find((c) => c.id === conn.fromCell)
        const toCell = scene.cells.find((c) => c.id === conn.toCell)
        if (!fromCell || !toCell) return null

        const fromCenter = cellCenter(fromCell.col, fromCell.row, cellSize, offset)
        const toCenter = cellCenter(toCell.col, toCell.row, cellSize, offset)
        const fromPort = portPoint(fromCenter, conn.fromPort)
        const toPort = portPoint(toCenter, conn.toPort)

        return (
          <g key={`connection-${idx}`}>
            {/* Línea entre los dos puertos */}
            <line
              x1={fromPort.x}
              y1={fromPort.y}
              x2={toPort.x}
              y2={toPort.y}
              stroke="#7c9cb5"
              strokeWidth={2.5}
              opacity={0.7}
              data-testid={`connection-${conn.fromCell}-${conn.toCell}`}
            />
            {/* Puntos en cada extremo (marcan el puerto exacto) */}
            <circle cx={fromPort.x} cy={fromPort.y} r={3} fill="#5a7d99" />
            <circle cx={toPort.x} cy={toPort.y} r={3} fill="#5a7d99" />
          </g>
        )
      })}

      {/* Capa 4b: Puertos clicables (solo en modo connect) */}
      {tool === 'connect' &&
        scene.cells.map((cell) => {
          const center = cellCenter(cell.col, cell.row, cellSize, offset)
          return [0, 1, 2, 3].map((port) => {
            const pt = portPoint(center, port)
            const isConnected = sceneOps.portConnection(scene, cell.id, port) !== null
            const isPending =
              pendingConnect?.cellId === cell.id && pendingConnect?.port === port
            const fill = isPending ? '#ff6b6b' : isConnected ? '#5a7d99' : '#fff'
            return (
              <circle
                key={`port-${cell.id}-${port}`}
                cx={pt.x}
                cy={pt.y}
                r={7}
                fill={fill}
                stroke="#333"
                strokeWidth={1.5}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  handlePortClick(cell.id, port)
                }}
                data-testid={`port-${cell.id}-${port}`}
              />
            )
          })
        })}

      {/* Capa 5: Flechas — formas coloridas grandes sobre los tiles */}
      {scene.arrows.length > 0 && (
        <g data-testid="arrows-layer">
          {scene.arrows.map((arrow, arrowIndex) => {
            const headCell = scene.cells.find((c) => c.id === arrow.head.cellId)
            if (!headCell) {
              console.warn(
                `[ForgeCanvas] Arrow ${arrow.id} head cell not found: ${arrow.head.cellId}`,
              )
              return null
            }

            const headCenter = cellCenter(headCell.col, headCell.row, cellSize, offset)
            const centers: Point[] = [headCenter]
            for (const bodyId of arrow.body) {
              const bodyCell = scene.cells.find((c) => c.id === bodyId)
              if (!bodyCell) {
                console.warn(
                  `[ForgeCanvas] Arrow ${arrow.id} body cell not found: ${bodyId}`,
                )
                continue
              }
              centers.push(cellCenter(bodyCell.col, bodyCell.row, cellSize, offset))
            }

            const color = DEFAULT_ARROW_PALETTE[arrowIndex % DEFAULT_ARROW_PALETTE.length]
            const isSelected = arrow.id === selectedArrowId
            const bodyWidth = tileSize * 0.32
            const nodeRadius = tileSize * 0.28
            const tipCenter = centers[centers.length - 1]

            // Dirección de la punta: a lo largo del último segmento del cuerpo.
            // Si la flecha solo tiene cabeza (sin cuerpo), usa el exitPort configurado.
            let tipDir: { dCol: number; dRow: number }
            if (centers.length > 1) {
              const prev = centers[centers.length - 2]
              const dx = tipCenter.x - prev.x
              const dy = tipCenter.y - prev.y
              const len = Math.hypot(dx, dy) || 1
              tipDir = { dCol: dx / len, dRow: dy / len }
            } else {
              tipDir = portDelta(arrow.head.exitPort)
            }

            // Triángulo de la punta en la última celda, orientado según tipDir
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

            // Marcador del exitPort en la cabeza (siempre visible, aunque tenga cuerpo)
            const exitDir = portDelta(arrow.head.exitPort)
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

                {/* Marcador del exitPort en la cabeza (dirección de salida configurada) */}
                <line
                  x1={headCenter.x}
                  y1={headCenter.y}
                  x2={exitMarkX}
                  y2={exitMarkY}
                  stroke="#fff"
                  strokeWidth={3}
                  opacity={0.95}
                />

                {/* Punta triangular en la última celda, a lo largo del cuerpo */}
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

          // Encontrar todas las celdas conectadas a lastCellId
          for (const conn of scene.connections) {
            if (conn.fromCell === lastCellId) {
              candidateCellIds.add(conn.toCell)
            }
            if (conn.toCell === lastCellId) {
              candidateCellIds.add(conn.fromCell)
            }
          }

          // Filtrar: no ocupadas (o ocupadas por la misma flecha), no es la última celda
          for (const candCellId of candidateCellIds) {
            if (candCellId === lastCellId) continue

            const occupyingArrow = sceneOps.occupiedBy(scene, candCellId)
            if (occupyingArrow && occupyingArrow !== selectedArrow.id) continue // Ocupada por otro

            const candCell = scene.cells.find((c) => c.id === candCellId)
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
