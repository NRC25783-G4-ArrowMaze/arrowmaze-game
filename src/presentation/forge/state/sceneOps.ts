import type { Scene, SceneCell, SceneArrow } from '../../game/scene'

/**
 * sceneOps — Operaciones puras sobre Scene.
 * Todas devuelven una Scene nueva sin mutar la original.
 */

export function cellIdAt(col: number, row: number): string {
  return `${col},${row}`
}

export function cellFromId(cellId: string): { col: number; row: number } | null {
  const [col, row] = cellId.split(',').map(Number)
  if (!Number.isFinite(col) || !Number.isFinite(row)) {
    return null
  }
  return { col, row }
}

export function addCell(scene: Scene, col: number, row: number): Scene {
  const id = cellIdAt(col, row)
  // No agregar si ya existe
  if (scene.cells.some((c) => c.id === id)) {
    return scene
  }
  const newCell: SceneCell = { id, col, row, portCount: 4 }
  return {
    ...scene,
    cells: [...scene.cells, newCell],
  }
}

export function removeCell(scene: Scene, cellId: string): Scene {
  // Quitar la celda
  const newCells = scene.cells.filter((c) => c.id !== cellId)

  // Quitar conexiones que referenciaban esta celda
  const newConnections = scene.connections.filter(
    (c) => c.fromCell !== cellId && c.toCell !== cellId,
  )

  // Quitar o truncar flechas que la ocupaban
  const newArrows = scene.arrows
    .filter((a) => a.head.cellId !== cellId) // Si es la cabeza, elimina toda la flecha
    .map((a) => {
      // Si está en el body, truncar el body
      const bodyIndex = a.body.indexOf(cellId)
      if (bodyIndex === -1) return a
      return { ...a, body: a.body.slice(0, bodyIndex) }
    })
    .filter((a) => a.body.length > 0 || a.head.cellId !== cellId) // Eliminar flechas vacías

  return {
    ...scene,
    cells: newCells,
    connections: newConnections,
    arrows: newArrows,
  }
}

/**
 * Calcula el puerto de salida derivado del delta entre dos celdas.
 * Inverso de portDelta: dado que B está en dirección delta respecto a A,
 * qué puerto de A apunta hacia B.
 */
function deltaToPort(dCol: number, dRow: number): number {
  if (dRow === -1 && dCol === 0) return 0 // N
  if (dRow === 0 && dCol === 1) return 1 // E
  if (dRow === 1 && dCol === 0) return 2 // S
  if (dRow === 0 && dCol === -1) return 3 // O
  return -1 // No adyacente
}

/**
 * Intenta conectar dos celdas. Devuelve null si no son adyacentes ortogonales.
 * Si ya están conectadas, las desconecta (toggle).
 */
export function toggleConnection(
  scene: Scene,
  cellIdA: string,
  cellIdB: string,
): Scene | null {
  const cellA = scene.cells.find((c) => c.id === cellIdA)
  const cellB = scene.cells.find((c) => c.id === cellIdB)

  if (!cellA || !cellB) return null

  const posA = cellFromId(cellIdA)
  const posB = cellFromId(cellIdB)
  if (!posA || !posB) return null

  const dCol = posB.col - posA.col
  const dRow = posB.row - posA.row

  // Derivar puertos
  const fromPort = deltaToPort(dCol, dRow)
  const toPort = deltaToPort(-dCol, -dRow)

  if (fromPort === -1 || toPort === -1) {
    return null // No son adyacentes ortogonales
  }

  // Verificar si ya existe la conexión (en cualquier dirección)
  const exists = scene.connections.some(
    (c) =>
      (c.fromCell === cellIdA && c.fromPort === fromPort && c.toCell === cellIdB && c.toPort === toPort) ||
      (c.fromCell === cellIdB && c.fromPort === toPort && c.toCell === cellIdA && c.toPort === fromPort),
  )

  if (exists) {
    // Toggle: quitar la conexión
    const newConnections = scene.connections.filter(
      (c) =>
        !(
          (c.fromCell === cellIdA && c.fromPort === fromPort && c.toCell === cellIdB && c.toPort === toPort) ||
          (c.fromCell === cellIdB && c.fromPort === toPort && c.toCell === cellIdA && c.toPort === fromPort)
        ),
    )
    return { ...scene, connections: newConnections }
  }

  // Agregar conexión bidireccional (pero solo un entry en el array, en forma canónica: menor cellId primero)
  const newConnection = {
    fromCell: cellIdA,
    fromPort,
    toCell: cellIdB,
    toPort,
  }
  return { ...scene, connections: [...scene.connections, newConnection] }
}

export function nextArrowId(scene: Scene): string {
  const indices = scene.arrows.map((a) => {
    const match = a.id.match(/^arrow-(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  })
  const maxIndex = indices.length > 0 ? Math.max(...indices) : 0
  return `arrow-${maxIndex + 1}`
}

export function placeHead(scene: Scene, cellId: string): Scene | null {
  // Verificar que la celda existe y está libre
  const cell = scene.cells.find((c) => c.id === cellId)
  if (!cell) return null

  const occupied = occupiedBy(scene, cellId)
  if (occupied) return null // Celda ocupada

  const newArrow: SceneArrow = {
    id: nextArrowId(scene),
    head: { cellId, exitPort: 0 },
    body: [],
    color: '', // Será asignado por paleta al renderizar
  }

  return { ...scene, arrows: [...scene.arrows, newArrow] }
}

export function rotateHead(scene: Scene, arrowId: string): Scene {
  const arrow = scene.arrows.find((a) => a.id === arrowId)
  if (!arrow) return scene

  const newExitPort = (arrow.head.exitPort + 1) % 4
  const newArrows = scene.arrows.map((a) =>
    a.id === arrowId ? { ...a, head: { ...a.head, exitPort: newExitPort } } : a,
  )

  return { ...scene, arrows: newArrows }
}

export function lastCellOf(arrow: SceneArrow): string {
  return arrow.body.length > 0 ? arrow.body[arrow.body.length - 1] : arrow.head.cellId
}

/**
 * Verifica si toCellId está conectada desde fromCellId vía algún puerto.
 * NO asume adyacencia ortogonal: verifica si hay una conexión directa
 * entre las celdas (pueden estar en cualquier dirección si tienen un puerto conectado).
 */
function isConnectedTo(scene: Scene, fromCellId: string, toCellId: string): boolean {
  // Buscar cualquier conexión desde fromCellId a toCellId
  return scene.connections.some(
    (c) =>
      (c.fromCell === fromCellId && c.toCell === toCellId) ||
      (c.fromCell === toCellId && c.toCell === fromCellId),
  )
}

export function extendArrow(scene: Scene, arrowId: string, cellId: string): Scene | null {
  const arrow = scene.arrows.find((a) => a.id === arrowId)
  if (!arrow) return null

  const cell = scene.cells.find((c) => c.id === cellId)
  if (!cell) return null

  // Verificar que no esté ocupada
  const occupied = occupiedBy(scene, cellId)
  if (occupied) return null

  const lastCell = lastCellOf(arrow)

  // Verificar adyacencia y conexión
  if (!isConnectedTo(scene, lastCell, cellId)) return null

  // Extender
  const newArrows = scene.arrows.map((a) =>
    a.id === arrowId ? { ...a, body: [...a.body, cellId] } : a,
  )

  return { ...scene, arrows: newArrows }
}

export function retractArrow(scene: Scene, arrowId: string): Scene {
  const arrow = scene.arrows.find((a) => a.id === arrowId)
  if (!arrow || arrow.body.length === 0) return scene

  const newArrows = scene.arrows.map((a) =>
    a.id === arrowId ? { ...a, body: a.body.slice(0, -1) } : a,
  )

  return { ...scene, arrows: newArrows }
}

export function deleteArrow(scene: Scene, arrowId: string): Scene {
  const newArrows = scene.arrows.filter((a) => a.id !== arrowId)
  return { ...scene, arrows: newArrows }
}

/**
 * Devuelve el arrowId que ocupa una celda (head o body), o null.
 */
export function occupiedBy(scene: Scene, cellId: string): string | null {
  for (const arrow of scene.arrows) {
    if (arrow.head.cellId === cellId) return arrow.id
    if (arrow.body.includes(cellId)) return arrow.id
  }
  return null
}
