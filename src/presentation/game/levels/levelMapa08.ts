import type { LevelDataDTO } from '../scene';
import { buildLevelData, type ArrowPathSpec } from './buildLevelData';

/**
 * mapa-08 — «Escaleras» (medio, 18×18).
 *
 * Escaleras diagonales arriba, peines largos al medio y remontes en
 * cadena abajo: peines → remontes → escaleras.
 *
 * Borrador generado para el mapa de niveles extendido; pensado para
 * afinarse en el FORGE (H1) — mismo contrato LevelDataDTO que exporta el
 * editor. Resolubilidad verificada tap a tap en localLevels.spec.ts.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

const PATHS: ArrowPathSpec[] = [
  { id: 'peine-6', cells: [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6]] },
  { id: 'peine-8', cells: [[1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [15, 8], [16, 8]] },
  { id: 'peine-10', cells: [[1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10], [15, 10], [16, 10]] },
  { id: 'peine-12', cells: [[1, 12], [2, 12], [3, 12], [4, 12], [5, 12], [6, 12], [7, 12], [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12], [14, 12], [15, 12], [16, 12]] },
  { id: 'peine-14', cells: [[1, 14], [2, 14], [3, 14], [4, 14], [5, 14], [6, 14], [7, 14], [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14]] },
  { id: 'escalera-0', cells: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4]] },
  { id: 'escalera-1', cells: [[2, 1], [2, 2], [3, 2], [3, 3], [4, 3], [4, 4]] },
  { id: 'escalera-2', cells: [[4, 1], [4, 2], [5, 2], [5, 3], [6, 3], [6, 4]] },
  { id: 'escalera-3', cells: [[6, 1], [6, 2], [7, 2], [7, 3], [8, 3], [8, 4]] },
  { id: 'escalera-4', cells: [[8, 1], [8, 2], [9, 2], [9, 3], [10, 3], [10, 4]] },
  { id: 'escalera-5', cells: [[10, 1], [10, 2], [11, 2], [11, 3], [12, 3], [12, 4]] },
  { id: 'escalera-6', cells: [[12, 1], [12, 2], [13, 2], [13, 3], [14, 3], [14, 4]] },
  { id: 'escalera-7', cells: [[14, 1], [14, 2], [15, 2], [15, 3], [16, 3], [16, 4]] },
  { id: 'remonte-0', cells: [[17, 17], [17, 16], [16, 16], [15, 16]] },
  { id: 'remonte-1', cells: [[14, 17], [14, 16], [13, 16], [12, 16]] },
  { id: 'remonte-2', cells: [[11, 17], [11, 16], [10, 16], [9, 16]] },
  { id: 'remonte-3', cells: [[8, 17], [8, 16], [7, 16], [6, 16]] },
];

export const LEVEL_MAPA_08: LevelDataDTO = {
  ...buildLevelData('mapa-08', 20, 18, 18, PATHS),
  name: 'Escaleras',
  difficulty: 'medium',
};
