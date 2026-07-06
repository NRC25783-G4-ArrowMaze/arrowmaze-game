import type {
  LevelDataDTO,
  LevelConnectionDTO,
} from '../../application/dtos/LevelDataDTOs';

/**
 * scene — Modelo de ESCENA de presentación.
 *
 * El dominio no modela posición (col/row) ni color: son datos de presentación.
 * Una Scene reúne ambos mundos para alimentar a la vez:
 *   - al motor: vía toLevelDataDTO() (solo id/portCount/conexiones/flechas).
 *   - al renderer: vía los col/row y color que el motor ignora.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

/** Celda de la escena: identidad + posición de rejilla + geometría de puertos. */
export interface SceneCell {
  id: string;
  col: number;
  row: number;
  portCount: number;
}

/** Flecha de la escena: color (presentación) + cabeza/cuerpo (dominio). */
export interface SceneArrow {
  id: string;
  color: string;
  head: { cellId: string; exitPort: number };
  body: string[];
}

/**
 * Comportamiento de una flecha al chocar (dato de presentación; el motor lo ignora):
 *   - 'return': la flecha se devuelve deslizándose a su posición de inicio de slide (DEFAULT).
 *   - 'stay':   la flecha queda donde chocó (opt-in para mapas puntuales).
 */
export type CollisionBehavior = 'stay' | 'return';

/** Escena completa: tablero + flechas + presupuesto de movimientos. */
export interface Scene {
  id: string;
  allowedMoves: number;
  cells: SceneCell[];
  connections: LevelConnectionDTO[];
  arrows: SceneArrow[];
  /** Qué hace una flecha al chocar. Default 'return'. */
  collisionBehavior?: CollisionBehavior;
}

/**
 * Proyecta una Scene al LevelDataDTO que consume el motor, descartando los
 * datos de presentación (col/row, color) que el dominio no conoce.
 */
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
  };
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
