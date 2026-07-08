import type { LevelDataDTO } from '../scene';
import { buildLevelData, type ArrowPathSpec } from './buildLevelData';

/**
 * level-intermediate-b — "Desafío B" (dificultad media).
 *
 * Tablero 6×6 teselado por 9 flechas en "U" de 4 celdas (bloques 2×2). Cada
 * fila de bloques escapa en un sentido alternado (E, O, E): el bloque cuyo
 * rayo de escape da al borde sale libre, y cada vecino depende del anterior.
 * Tres cadenas independientes de profundidad 3 → orden de resolución por
 * oleadas, con margen de 3 movimientos de error.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

/** U con salida al Este: cabeza abajo-derecha, punta arriba-derecha. */
const uEast = (id: string, x: number, y: number): ArrowPathSpec => ({
  id,
  cells: [[x + 1, y + 1], [x, y + 1], [x, y], [x + 1, y]],
});

/** U con salida al Oeste: cabeza arriba-izquierda, punta abajo-izquierda. */
const uWest = (id: string, x: number, y: number): ArrowPathSpec => ({
  id,
  cells: [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]],
});

const PATHS: ArrowPathSpec[] = [
  // Fila superior (sale al E): libre el de la derecha, cadena hacia la izquierda.
  uEast('top-left', 0, 0),
  uEast('top-mid', 2, 0),
  uEast('top-right', 4, 0),
  // Fila central (sale al O): libre el de la izquierda, cadena hacia la derecha.
  uWest('mid-left', 0, 2),
  uWest('mid-mid', 2, 2),
  uWest('mid-right', 4, 2),
  // Fila inferior (sale al E): como la superior.
  uEast('bottom-left', 0, 4),
  uEast('bottom-mid', 2, 4),
  uEast('bottom-right', 4, 4),
];

export const LEVEL_INTERMEDIATE_B: LevelDataDTO = buildLevelData(
  'level-intermediate-b',
  PATHS.length + 3,
  6,
  6,
  PATHS,
);
