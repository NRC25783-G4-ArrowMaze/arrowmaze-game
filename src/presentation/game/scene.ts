export interface LevelCellDTO {
  id: string
  portCount: number
  layer?: number   // Índice Z de la capa (0-based). Ausente = 0 (niveles 2D).
}

export interface LevelConnectionDTO {
  fromCell: string
  fromPort: number
  toCell: string
  toPort: number
}

export interface LevelArrowDTO {
  id: string
  head: { cellId: string; exitPort: number }
  body: string[]
}

export type CollisionBehavior = 'stay' | 'return'

export interface LevelDataDTO {
  id: string
  name?: string
  difficulty?: string
  mapMode?: '2d' | '3d'  // Modo del nivel. Ausente = '2d'.
  allowedMoves: number
  cells: LevelCellDTO[]
  connections?: LevelConnectionDTO[]
  arrows: LevelArrowDTO[]
  collisionBehavior?: CollisionBehavior
}

export interface SceneCell extends LevelCellDTO {
  col: number
  row: number
}

export interface SceneArrow extends LevelArrowDTO {
  color: string
}

export interface Scene {
  id: string
  name?: string
  difficulty?: string
  mapMode?: '2d' | '3d'  // Modo del nivel. Ausente = '2d'.
  allowedMoves: number
  cells: SceneCell[]
  connections: LevelConnectionDTO[]
  arrows: SceneArrow[]
  collisionBehavior?: CollisionBehavior
}

/**
 * Paleta por defecto para flechas de niveles remotos (F2): los 8 colores de
 * SAMPLE_LEVEL_2 en su orden. El contrato C2 no transporta color, así que un
 * nivel bajado de la API se colorea por índice de flecha; para sample-level-2
 * el resultado es idéntico al módulo local (JSON preserva el orden del array).
 */
export const DEFAULT_ARROW_PALETTE: readonly string[] = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f97316', // orange
  '#ec4899', // magenta
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#fb7185', // rose
]

export function toLevelDataDTO(scene: Scene): LevelDataDTO {
  return {
    id: scene.id,
    // Campos opcionales: solo se incluyen si están definidos para no emitir claves
    // con undefined en el payload.
    ...(scene.name !== undefined ? { name: scene.name } : {}),
    ...(scene.difficulty !== undefined ? { difficulty: scene.difficulty } : {}),
    ...(scene.mapMode !== undefined ? { mapMode: scene.mapMode } : {}),
    ...(scene.collisionBehavior !== undefined
      ? { collisionBehavior: scene.collisionBehavior }
      : {}),
    allowedMoves: scene.allowedMoves,
    // layer se omite si es 0 (retrocompat: los niveles 2D no emiten el campo).
    cells: scene.cells.map((c) => ({
      id: c.id,
      portCount: c.portCount,
      ...((c.layer !== undefined && c.layer > 0) ? { layer: c.layer } : {}),
    })),
    connections: scene.connections,
    arrows: scene.arrows.map((a) => ({
      id: a.id,
      head: { cellId: a.head.cellId, exitPort: a.head.exitPort },
      body: a.body,
    })),
  }
}

/**
 * Reconstruye una Scene desde el LevelDataDTO que sirve la API (inversa de
 * toLevelDataDTO): la posición de rejilla se recupera parseando el id de celda
 * "col,row" y el color se asigna por paleta. Lanza si un id no codifica
 * posición — el caller decide el fallback.
 */
export function sceneFromLevelData(
  dto: LevelDataDTO,
  palette: readonly string[] = DEFAULT_ARROW_PALETTE,
): Scene {
  return {
    id: dto.id,
    ...(dto.name !== undefined ? { name: dto.name } : {}),
    ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
    ...(dto.mapMode !== undefined ? { mapMode: dto.mapMode } : {}),
    ...(dto.collisionBehavior !== undefined
      ? { collisionBehavior: dto.collisionBehavior }
      : {}),
    allowedMoves: dto.allowedMoves,
    cells: dto.cells.map((c) => {
      const [col, row] = c.id.split(',').map(Number)
      if (!Number.isFinite(col) || !Number.isFinite(row)) {
        throw new Error(`id de celda sin posición "col,row": "${c.id}"`)
      }
      // layer defaultea a 0 para retrocompat con niveles 2D sin ese campo.
      return { id: c.id, col, row, portCount: c.portCount, layer: c.layer ?? 0 }
    }),
    connections: dto.connections ?? [],
    arrows: dto.arrows.map((a, i) => ({
      id: a.id,
      color: palette[i % palette.length],
      head: { cellId: a.head.cellId, exitPort: a.head.exitPort },
      body: a.body,
    })),
  }
}
