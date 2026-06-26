import type {
  LevelDataDTO,
  LevelConnectionDTO,
} from '../../infrastructure/shared/contracts/LevelDataDTOs';

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

/** Escena completa: tablero + flechas + presupuesto de movimientos. */
export interface Scene {
  id: string;
  allowedMoves: number;
  cells: SceneCell[];
  connections: LevelConnectionDTO[];
  arrows: SceneArrow[];
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
