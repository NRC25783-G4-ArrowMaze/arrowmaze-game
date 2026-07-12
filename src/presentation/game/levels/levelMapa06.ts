import type { LevelDataDTO } from '../scene';
import { buildLevelData, type ArrowPathSpec } from './buildLevelData';

/**
 * mapa-06 — «Corredores» (medio, 16×16).
 *
 * Peines horizontales enfrentados: las dos llaves verticales del centro
 * liberan los corredores de cada mitad.
 *
 * Borrador generado para el mapa de niveles extendido; pensado para
 * afinarse en el FORGE (H1) — mismo contrato LevelDataDTO que exporta el
 * editor. Resolubilidad verificada tap a tap en localLevels.spec.ts.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

const PATHS: ArrowPathSpec[] = [
  { id: 'llave-alta', cells: [[7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7]] },
  { id: 'llave-baja', cells: [[8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [8, 8]] },
  { id: 'este-2', cells: [[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2]] },
  { id: 'este-4', cells: [[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4]] },
  { id: 'este-6', cells: [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6]] },
  { id: 'este-8', cells: [[1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8]] },
  { id: 'este-10', cells: [[1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10]] },
  { id: 'este-12', cells: [[1, 12], [2, 12], [3, 12], [4, 12], [5, 12], [6, 12]] },
  { id: 'oeste-3', cells: [[14, 3], [13, 3], [12, 3], [11, 3], [10, 3], [9, 3]] },
  { id: 'oeste-5', cells: [[14, 5], [13, 5], [12, 5], [11, 5], [10, 5], [9, 5]] },
  { id: 'oeste-7', cells: [[14, 7], [13, 7], [12, 7], [11, 7], [10, 7], [9, 7]] },
  { id: 'oeste-9', cells: [[14, 9], [13, 9], [12, 9], [11, 9], [10, 9], [9, 9]] },
  { id: 'oeste-11', cells: [[14, 11], [13, 11], [12, 11], [11, 11], [10, 11], [9, 11]] },
  { id: 'oeste-13', cells: [[14, 13], [13, 13], [12, 13], [11, 13], [10, 13], [9, 13]] },
];

export const LEVEL_MAPA_06: LevelDataDTO = {
  ...buildLevelData('mapa-06', 17, 16, 16, PATHS),
  name: 'Corredores',
  difficulty: 'medium',
};
