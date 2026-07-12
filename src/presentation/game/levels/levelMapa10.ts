import type { LevelDataDTO } from '../scene';
import {
  buildShapedLevelData,
  type ArrowPathSpec,
  type GridCell,
} from './buildLevelData';

/**
 * mapa-10 — «Rombo» (medio, 21×21).
 *
 * Tablero con forma de ROMBO (no cuadriculado). Las alas este escapan
 * directo; las oeste cruzan la espina central, que debe salir antes
 * por el vértice sur.
 *
 * Borrador generado para el mapa de niveles extendido; pensado para
 * afinarse en el FORGE (H1) — mismo contrato LevelDataDTO que exporta el
 * editor. Resolubilidad verificada tap a tap en localLevels.spec.ts.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

/** Celdas del rombo: |col − 10| + |fila − 10| ≤ 10 sobre 21×21. */
function diamondCells(): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < 21; row++) {
    const w = 10 - Math.abs(row - 10);
    for (let col = 10 - w; col <= 10 + w; col++) {
      cells.push([col, row]);
    }
  }
  return cells;
}

const PATHS: ArrowPathSpec[] = [
  { id: 'espina-baja', cells: [[10, 12], [10, 13], [10, 14], [10, 15], [10, 16], [10, 17]] },
  { id: 'espina-alta', cells: [[10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8], [10, 9], [10, 10]] },
  { id: 'ala-este-2', cells: [[11, 2], [12, 2]] },
  { id: 'ala-este-3', cells: [[11, 3], [12, 3], [13, 3]] },
  { id: 'ala-oeste-3', cells: [[8, 3], [9, 3]] },
  { id: 'ala-este-4', cells: [[11, 4], [12, 4], [13, 4], [14, 4]] },
  { id: 'ala-oeste-4', cells: [[7, 4], [8, 4], [9, 4]] },
  { id: 'ala-este-5', cells: [[11, 5], [12, 5], [13, 5], [14, 5], [15, 5]] },
  { id: 'ala-oeste-5', cells: [[6, 5], [7, 5], [8, 5], [9, 5]] },
  { id: 'ala-este-6', cells: [[11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6]] },
  { id: 'ala-oeste-6', cells: [[5, 6], [6, 6], [7, 6], [8, 6], [9, 6]] },
  { id: 'ala-este-7', cells: [[11, 7], [12, 7], [13, 7], [14, 7], [15, 7], [16, 7], [17, 7]] },
  { id: 'ala-oeste-7', cells: [[4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7]] },
  { id: 'ala-este-8', cells: [[11, 8], [12, 8], [13, 8], [14, 8], [15, 8], [16, 8], [17, 8], [18, 8]] },
  { id: 'ala-oeste-8', cells: [[3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8]] },
  { id: 'ala-este-9', cells: [[11, 9], [12, 9], [13, 9], [14, 9], [15, 9], [16, 9], [17, 9], [18, 9], [19, 9]] },
  { id: 'ala-oeste-9', cells: [[2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9]] },
  { id: 'ala-este-10', cells: [[11, 10], [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [17, 10], [18, 10], [19, 10], [20, 10]] },
  { id: 'ala-oeste-10', cells: [[1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10]] },
  { id: 'ala-este-11', cells: [[11, 11], [12, 11], [13, 11], [14, 11], [15, 11], [16, 11], [17, 11], [18, 11], [19, 11]] },
  { id: 'ala-oeste-11', cells: [[2, 11], [3, 11], [4, 11], [5, 11], [6, 11], [7, 11], [8, 11], [9, 11]] },
  { id: 'ala-este-12', cells: [[11, 12], [12, 12], [13, 12], [14, 12], [15, 12], [16, 12], [17, 12], [18, 12]] },
  { id: 'ala-oeste-12', cells: [[3, 12], [4, 12], [5, 12], [6, 12], [7, 12], [8, 12], [9, 12]] },
  { id: 'ala-este-13', cells: [[11, 13], [12, 13], [13, 13], [14, 13], [15, 13], [16, 13], [17, 13]] },
  { id: 'ala-oeste-13', cells: [[4, 13], [5, 13], [6, 13], [7, 13], [8, 13], [9, 13]] },
  { id: 'ala-este-14', cells: [[11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14]] },
  { id: 'ala-oeste-14', cells: [[5, 14], [6, 14], [7, 14], [8, 14], [9, 14]] },
  { id: 'ala-este-15', cells: [[11, 15], [12, 15], [13, 15], [14, 15], [15, 15]] },
  { id: 'ala-oeste-15', cells: [[6, 15], [7, 15], [8, 15], [9, 15]] },
  { id: 'ala-este-16', cells: [[11, 16], [12, 16], [13, 16], [14, 16]] },
  { id: 'ala-oeste-16', cells: [[7, 16], [8, 16], [9, 16]] },
  { id: 'ala-este-17', cells: [[11, 17], [12, 17], [13, 17]] },
  { id: 'ala-oeste-17', cells: [[8, 17], [9, 17]] },
  { id: 'ala-este-18', cells: [[11, 18], [12, 18]] },
];

export const LEVEL_MAPA_10: LevelDataDTO = {
  ...buildShapedLevelData('mapa-10', 37, diamondCells(), PATHS),
  name: 'Rombo',
  difficulty: 'medium',
};
