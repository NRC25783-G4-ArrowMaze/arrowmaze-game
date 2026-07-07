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
 * Devuelve la conexión que ocupa un puerto concreto de una celda, o null.
 * Un puerto solo puede tener UNA conexión (regla del dominio A1/BLOQUE 3).
 */
export function portConnection(
  scene: Scene,
  cellId: string,
  port: number,
): Scene['connections'][number] | null {
  return (
    scene.connections.find(
      (c) =>
        (c.fromCell === cellId && c.fromPort === port) ||
        (c.toCell === cellId && c.toPort === port),
    ) ?? null
  )
}

/**
 * Conecta un puerto de una celda con un puerto de otra.
 * Modelo del dominio (A1/BLOQUE 3): enlace puerto-a-puerto arbitrario.
 * NO exige adyacencia espacial ni puertos opuestos.
 * Devuelve null si:
 *  - alguna celda no existe
 *  - es la misma celda (auto-conexión prohibida)
 *  - alguno de los puertos ya está ocupado
 */
export function connectPorts(
  scene: Scene,
  cellIdA: string,
  portA: number,
  cellIdB: string,
  portB: number,
): Scene | null {
  if (cellIdA === cellIdB) return null // auto-conexión prohibida

  const cellA = scene.cells.find((c) => c.id === cellIdA)
  const cellB = scene.cells.find((c) => c.id === cellIdB)
  if (!cellA || !cellB) return null

  // Puertos deben estar libres
  if (portConnection(scene, cellIdA, portA)) return null
  if (portConnection(scene, cellIdB, portB)) return null

  const newConnection = {
    fromCell: cellIdA,
    fromPort: portA,
    toCell: cellIdB,
    toPort: portB,
  }
  return { ...scene, connections: [...scene.connections, newConnection] }
}

/**
 * Elimina la conexión que toca el puerto (cellId, port), si existe.
 */
export function disconnectPort(scene: Scene, cellId: string, port: number): Scene {
  const conn = portConnection(scene, cellId, port)
  if (!conn) return scene
  return {
    ...scene,
    connections: scene.connections.filter((c) => c !== conn),
  }
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

  // Solo tiene sentido rotar cuando la flecha aún no tiene cuerpo: en cuanto hay
  // un primer segmento, el exitPort queda determinado por él (ver extendArrow).
  if (arrow.body.length > 0) return scene

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

/**
 * Devuelve el puerto del lado de `fromCellId` en la conexión que la une con
 * `toCellId`, o null si no hay conexión. Es el puerto por el que se "sale" de
 * fromCell hacia toCell.
 */
export function portBetween(
  scene: Scene,
  fromCellId: string,
  toCellId: string,
): number | null {
  for (const c of scene.connections) {
    if (c.fromCell === fromCellId && c.toCell === toCellId) return c.fromPort
    if (c.fromCell === toCellId && c.toCell === fromCellId) return c.toPort
  }
  return null
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

  // Al añadir el PRIMER segmento, el exitPort de la cabeza debe apuntar al puerto
  // por el que la flecha sale de la cabeza hacia ese primer segmento. Así el
  // exitPort siempre es coherente con el cuerpo (regla del dominio) y la cabeza
  // no se ve "apuntando al lado contrario".
  const isFirstSegment = arrow.body.length === 0
  const derivedExitPort = isFirstSegment ? portBetween(scene, arrow.head.cellId, cellId) : null

  const newArrows = scene.arrows.map((a) => {
    if (a.id !== arrowId) return a
    const head =
      derivedExitPort !== null ? { ...a.head, exitPort: derivedExitPort } : a.head
    return { ...a, head, body: [...a.body, cellId] }
  })

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
