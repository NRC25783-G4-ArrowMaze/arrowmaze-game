import type { LevelDataDTO } from '../scene';
import { buildLevelData, type ArrowPathSpec } from './buildLevelData';

/**
 * level-advanced — "Avanzado" (dificultad alta).
 *
 * Tablero 6×6: molinete perimetral de 4 flechas largas (5 celdas) más 4 filas
 * interiores de 4 celdas. El molinete puro sería un interbloqueo circular
 * (T←R←B←L←T); se rompe invirtiendo la flecha izquierda, cuya punta escapa
 * directa por el borde inferior. El perímetro se resuelve en cadena de
 * profundidad 4 y cada fila interior depende del lado por el que escapa.
 * Margen de solo 2 movimientos de error.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

const PATHS: ArrowPathSpec[] = [
  // Perímetro (molinete roto): izquierda escapa al S por el borde.
  { id: 'left', cells: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
  // Inferior: escapa al O a través de la celda que libera 'left'.
  { id: 'bottom', cells: [[5, 5], [4, 5], [3, 5], [2, 5], [1, 5]] },
  // Derecha: escapa al S a través de la celda que libera 'bottom'.
  { id: 'right', cells: [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4]] },
  // Superior: escapa al E a través de la celda que libera 'right'.
  { id: 'top', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  // Filas interiores: alternan salida E (dependen de 'right') y O (de 'left').
  { id: 'row-1', cells: [[1, 1], [2, 1], [3, 1], [4, 1]] },
  { id: 'row-2', cells: [[4, 2], [3, 2], [2, 2], [1, 2]] },
  { id: 'row-3', cells: [[1, 3], [2, 3], [3, 3], [4, 3]] },
  { id: 'row-4', cells: [[4, 4], [3, 4], [2, 4], [1, 4]] },
];

export const LEVEL_ADVANCED: LevelDataDTO = buildLevelData(
  'level-advanced',
  PATHS.length + 2,
  6,
  6,
  PATHS,
);
