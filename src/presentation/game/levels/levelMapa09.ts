import type { LevelDataDTO } from '../scene';
import { buildLevelData, type ArrowPathSpec } from './buildLevelData';

/**
 * mapa-09 — «Cuatro Cuadrantes» (medio, 19×19).
 *
 * Cuatro molinetes 9×9 cuyos corredores de escape cruzan el cuadrante
 * vecino: hay que coordinar el orden entre cuadrantes.
 *
 * Borrador generado para el mapa de niveles extendido; pensado para
 * afinarse en el FORGE (H1) — mismo contrato LevelDataDTO que exporta el
 * editor. Resolubilidad verificada tap a tap en localLevels.spec.ts.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

const PATHS: ArrowPathSpec[] = [
  { id: 'q0-left', cells: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8]] },
  { id: 'q0-bottom', cells: [[8, 8], [7, 8], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8]] },
  { id: 'q0-right', cells: [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7]] },
  { id: 'q0-top', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]] },
  { id: 'q0-int-a', cells: [[2, 2], [3, 2], [4, 2], [5, 2], [6, 2]] },
  { id: 'q0-int-b', cells: [[2, 3], [2, 4], [3, 4], [4, 4], [5, 4]] },
  { id: 'q1-left', cells: [[10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8]] },
  { id: 'q1-bottom', cells: [[18, 8], [17, 8], [16, 8], [15, 8], [14, 8], [13, 8], [12, 8], [11, 8]] },
  { id: 'q1-right', cells: [[18, 0], [18, 1], [18, 2], [18, 3], [18, 4], [18, 5], [18, 6], [18, 7]] },
  { id: 'q1-top', cells: [[10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0]] },
  { id: 'q1-int-a', cells: [[12, 2], [13, 2], [14, 2], [15, 2], [16, 2]] },
  { id: 'q1-int-b', cells: [[12, 3], [12, 4], [13, 4], [14, 4], [15, 4]] },
  { id: 'q2-left', cells: [[0, 11], [0, 12], [0, 13], [0, 14], [0, 15], [0, 16], [0, 17], [0, 18]] },
  { id: 'q2-bottom', cells: [[8, 18], [7, 18], [6, 18], [5, 18], [4, 18], [3, 18], [2, 18], [1, 18]] },
  { id: 'q2-right', cells: [[8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [8, 15], [8, 16], [8, 17]] },
  { id: 'q2-top', cells: [[0, 10], [1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10]] },
  { id: 'q2-int-a', cells: [[2, 12], [3, 12], [4, 12], [5, 12], [6, 12]] },
  { id: 'q2-int-b', cells: [[2, 13], [2, 14], [3, 14], [4, 14], [5, 14]] },
  { id: 'q3-left', cells: [[10, 11], [10, 12], [10, 13], [10, 14], [10, 15], [10, 16], [10, 17], [10, 18]] },
  { id: 'q3-bottom', cells: [[18, 18], [17, 18], [16, 18], [15, 18], [14, 18], [13, 18], [12, 18], [11, 18]] },
  { id: 'q3-right', cells: [[18, 10], [18, 11], [18, 12], [18, 13], [18, 14], [18, 15], [18, 16], [18, 17]] },
  { id: 'q3-top', cells: [[10, 10], [11, 10], [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [17, 10]] },
  { id: 'q3-int-a', cells: [[12, 12], [13, 12], [14, 12], [15, 12], [16, 12]] },
  { id: 'q3-int-b', cells: [[12, 13], [12, 14], [13, 14], [14, 14], [15, 14]] },
];

export const LEVEL_MAPA_09: LevelDataDTO = {
  ...buildLevelData('mapa-09', 27, 19, 19, PATHS),
  name: 'Cuatro Cuadrantes',
  difficulty: 'medium',
};
