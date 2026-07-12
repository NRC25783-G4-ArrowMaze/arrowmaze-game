import type { LevelDataDTO } from '../scene';
import { buildLevelData, type ArrowPathSpec } from './buildLevelData';

/**
 * mapa-11 — «Molinete Doble» (difícil, 21×21).
 *
 * Dos molinetes anidados 10×10 (NO y SE) encadenados por cerrojos en
 * las esquinas libres: el bloque SE libera el cerrojo NE que sella
 * al NO.
 *
 * Borrador generado para el mapa de niveles extendido; pensado para
 * afinarse en el FORGE (H1) — mismo contrato LevelDataDTO que exporta el
 * editor. Resolubilidad verificada tap a tap en localLevels.spec.ts.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

const PATHS: ArrowPathSpec[] = [
  { id: 'no0-left', cells: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9]] },
  { id: 'no0-bottom', cells: [[9, 9], [8, 9], [7, 9], [6, 9], [5, 9], [4, 9], [3, 9], [2, 9], [1, 9]] },
  { id: 'no0-right', cells: [[9, 0], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7], [9, 8]] },
  { id: 'no0-top', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0]] },
  { id: 'se0-left', cells: [[11, 12], [11, 13], [11, 14], [11, 15], [11, 16], [11, 17], [11, 18], [11, 19], [11, 20]] },
  { id: 'se0-bottom', cells: [[20, 20], [19, 20], [18, 20], [17, 20], [16, 20], [15, 20], [14, 20], [13, 20], [12, 20]] },
  { id: 'se0-right', cells: [[20, 11], [20, 12], [20, 13], [20, 14], [20, 15], [20, 16], [20, 17], [20, 18], [20, 19]] },
  { id: 'se0-top', cells: [[11, 11], [12, 11], [13, 11], [14, 11], [15, 11], [16, 11], [17, 11], [18, 11], [19, 11]] },
  { id: 'no1-left', cells: [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8]] },
  { id: 'no1-bottom', cells: [[8, 8], [7, 8], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8]] },
  { id: 'no1-right', cells: [[8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7]] },
  { id: 'no1-top', cells: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]] },
  { id: 'se1-left', cells: [[12, 13], [12, 14], [12, 15], [12, 16], [12, 17], [12, 18], [12, 19]] },
  { id: 'se1-bottom', cells: [[19, 19], [18, 19], [17, 19], [16, 19], [15, 19], [14, 19], [13, 19]] },
  { id: 'se1-right', cells: [[19, 12], [19, 13], [19, 14], [19, 15], [19, 16], [19, 17], [19, 18]] },
  { id: 'se1-top', cells: [[12, 12], [13, 12], [14, 12], [15, 12], [16, 12], [17, 12], [18, 12]] },
  { id: 'no2-left', cells: [[2, 3], [2, 4], [2, 5], [2, 6], [2, 7]] },
  { id: 'no2-bottom', cells: [[7, 7], [6, 7], [5, 7], [4, 7], [3, 7]] },
  { id: 'no2-right', cells: [[7, 2], [7, 3], [7, 4], [7, 5], [7, 6]] },
  { id: 'no2-top', cells: [[2, 2], [3, 2], [4, 2], [5, 2], [6, 2]] },
  { id: 'se2-left', cells: [[13, 14], [13, 15], [13, 16], [13, 17], [13, 18]] },
  { id: 'se2-bottom', cells: [[18, 18], [17, 18], [16, 18], [15, 18], [14, 18]] },
  { id: 'se2-right', cells: [[18, 13], [18, 14], [18, 15], [18, 16], [18, 17]] },
  { id: 'se2-top', cells: [[13, 13], [14, 13], [15, 13], [16, 13], [17, 13]] },
  { id: 'no-nucleo-a', cells: [[3, 4], [4, 4], [5, 4], [6, 4]] },
  { id: 'no-nucleo-b', cells: [[3, 5], [3, 6], [4, 6], [5, 6]] },
  { id: 'se-nucleo-a', cells: [[14, 15], [15, 15], [16, 15], [17, 15]] },
  { id: 'se-nucleo-b', cells: [[14, 16], [14, 17], [15, 17], [16, 17]] },
  { id: 'cerrojo-ne', cells: [[14, 0], [14, 1], [14, 2], [14, 3], [14, 4]] },
  { id: 'cerrojo-so', cells: [[1, 13], [1, 14], [1, 15], [1, 16], [1, 17]] },
  { id: 'cerrojo-so2', cells: [[2, 12], [2, 13], [2, 14], [2, 15]] },
];

export const LEVEL_MAPA_11: LevelDataDTO = {
  ...buildLevelData('mapa-11', 33, 21, 21, PATHS),
  name: 'Molinete Doble',
  difficulty: 'hard',
};
