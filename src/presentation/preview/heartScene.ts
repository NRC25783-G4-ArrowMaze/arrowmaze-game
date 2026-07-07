import type { Scene, SceneArrow, SceneCell } from '../game/scene'
import type { LevelConnectionDTO } from '../../application/dtos/LevelDataDTOs'

/**
 * heartScene — Mapa para la página de preview con forma de corazón.
 *
 * El tablero es un GRAFO (no una matriz): solo existen los nodos del corazón, y
 * se conectan únicamente con sus vecinos del corazón. Cada flecha es un "camino"
 * de celdas adyacentes y apunta hacia AFUERA del corazón, de modo que el nivel es
 * resoluble: deslizando cada flecha sale por su borde y el tablero queda vacío.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

const PORTS = 4

/** Paleta tomada del icono. */
const C = {
  yellow: '#ffe23b',
  white: '#ffffff',
  green: '#3bff6e',
  orange: '#ff7a1a',
  salmon: '#ff9d9d',
  magenta: '#ff2bd6',
} as const

/** Un camino de flecha: celdas en orden cabeza→punta (cada par debe ser adyacente). */
interface ArrowPath {
  id: string
  color: string
  cells: Array<[number, number]>
}

type Cell = [number, number]

/** Puerto de salida de `a` hacia `b` (deben ser ortogonalmente adyacentes). */
function dirPort(a: Cell, b: Cell): number {
  const dc = b[0] - a[0]
  const dr = b[1] - a[1]
  if (dc === 0 && dr === -1) return 0 // N
  if (dc === 1 && dr === 0) return 1 // E
  if (dc === 0 && dr === 1) return 2 // S
  if (dc === -1 && dr === 0) return 3 // O
  throw new Error(`celdas no adyacentes en un camino: [${a}] -> [${b}]`)
}

const idOf = (c: Cell): string => `${c[0]},${c[1]}`

/**
 * Construye una Scene-grafo: solo los nodos usados por las flechas, conectados a
 * sus vecinos (E/S) que también existan. Valida adyacencia y solapamientos.
 */
export function buildHeartScene(paths: ArrowPath[], allowedMoves = 99): Scene {
  const used = new Map<string, Cell>()
  const owner = new Map<string, string>()

  for (const p of paths) {
    if (p.cells.length < 2) {
      throw new Error(`la flecha ${p.id} necesita >= 2 celdas`)
    }
    p.cells.forEach((c, i) => {
      const id = idOf(c)
      const prev = owner.get(id)
      if (prev !== undefined) {
        throw new Error(`solapamiento en ${id}: ${p.id} pisa a ${prev}`)
      }
      owner.set(id, p.id)
      used.set(id, c)
      if (i > 0) dirPort(p.cells[i - 1], c) // lanza si no es adyacente
    })
  }

  // Nodos: solo las celdas usadas (grafo, no matriz). col/row para presentación.
  const cells: SceneCell[] = [...used.values()].map(([col, row]) => ({
    id: `${col},${row}`,
    col,
    row,
    portCount: PORTS,
  }))

  // Conexiones: cada nodo con su vecino E y S si también es un nodo del grafo.
  const connections: LevelConnectionDTO[] = []
  for (const [col, row] of used.values()) {
    const id = `${col},${row}`
    const east = `${col + 1},${row}`
    const south = `${col},${row + 1}`
    if (used.has(east)) {
      connections.push({ fromCell: id, fromPort: 1, toCell: east, toPort: 3 })
    }
    if (used.has(south)) {
      connections.push({ fromCell: id, fromPort: 2, toCell: south, toPort: 0 })
    }
  }

  const arrows: SceneArrow[] = paths.map((p) => ({
    id: p.id,
    color: p.color,
    head: { cellId: idOf(p.cells[0]), exitPort: dirPort(p.cells[0], p.cells[1]) },
    body: p.cells.slice(1).map(idOf),
  }))

  return { id: 'heart-preview', allowedMoves, cells, connections, arrows }
}

/**
 * Corazón esquemático (cols 0–8, rows 0–6). Cada camino va cabeza→punta y la
 * punta apunta hacia AFUERA del corazón (lóbulos→N, costados→O/E, base→S), así
 * cada flecha puede deslizarse hasta salir y el nivel es resoluble.
 */
const HEART_PATHS: ArrowPath[] = [
  // ── Contorno IZQUIERDO: escalera del centro-bajo al tope del lóbulo (punta N) ──
  {
    id: 'yellow',
    color: C.yellow,
    cells: [[4, 5], [3, 5], [3, 4], [2, 4], [2, 3], [1, 3], [1, 2], [1, 1], [1, 0]],
  },
  // ── Contorno DERECHO: escalera del centro-bajo al tope del lóbulo (punta N) ──
  {
    id: 'green',
    color: C.green,
    cells: [[5, 5], [5, 4], [6, 4], [6, 3], [7, 3], [7, 2], [7, 1], [7, 0]],
  },
  // ── Cimas de los lóbulos (ensanchan cada bulto), apuntan al Norte ──
  { id: 'white', color: C.white, cells: [[2, 2], [2, 1], [2, 0]] },
  { id: 'magenta', color: C.magenta, cells: [[6, 2], [6, 1], [6, 0]] },
  // ── Relleno central que baja al escote y la punta (apunta al Sur) ──
  { id: 'orange', color: C.orange, cells: [[4, 2], [4, 3], [4, 4]] },
]

export const HEART_SCENE: Scene = buildHeartScene(HEART_PATHS)
