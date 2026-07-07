export interface LevelCellDTO {
  id: string
  portCount: number
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

export interface LevelDataDTO {
  id: string
  name?: string
  difficulty?: string
  allowedMoves: number
  cells: LevelCellDTO[]
  connections?: LevelConnectionDTO[]
  arrows: LevelArrowDTO[]
}

export interface SceneCell extends LevelCellDTO {
  col: number
  row: number
}

export interface SceneArrow extends LevelArrowDTO {
  color: string
}

export type CollisionBehavior = 'stay' | 'return'

export interface Scene {
  id: string
  name?: string
  difficulty?: string
  allowedMoves: number
  cells: SceneCell[]
  connections: LevelConnectionDTO[]
  arrows: SceneArrow[]
  collisionBehavior?: CollisionBehavior
}

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
    allowedMoves: scene.allowedMoves,
    cells: scene.cells.map((c) => ({ id: c.id, portCount: c.portCount })),
    connections: scene.connections,
    arrows: scene.arrows.map((a) => ({
      id: a.id,
      head: { cellId: a.head.cellId, exitPort: a.head.exitPort },
      body: a.body,
    })),
  }
}

export function sceneFromLevelData(
  dto: LevelDataDTO,
  palette: readonly string[] = DEFAULT_ARROW_PALETTE,
): Scene {
  return {
    id: dto.id,
    allowedMoves: dto.allowedMoves,
    cells: dto.cells.map((c) => {
      const [col, row] = c.id.split(',').map(Number)
      if (!Number.isFinite(col) || !Number.isFinite(row)) {
        throw new Error(`id de celda sin posición "col,row": "${c.id}"`)
      }
      return { id: c.id, col, row, portCount: c.portCount }
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
];

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
    allowedMoves: dto.allowedMoves,
    cells: dto.cells.map((c) => {
      const [col, row] = c.id.split(',').map(Number);
      if (!Number.isFinite(col) || !Number.isFinite(row)) {
        throw new Error(`id de celda sin posición "col,row": "${c.id}"`);
      }
      return { id: c.id, col, row, portCount: c.portCount };
    }),
    connections: dto.connections ?? [],
    arrows: dto.arrows.map((a, i) => ({
      id: a.id,
      color: palette[i % palette.length],
      head: { cellId: a.head.cellId, exitPort: a.head.exitPort },
      body: a.body,
    })),
  };
}
