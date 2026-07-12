import type { LevelDataDTO } from '../scene';
import {
  buildShapedLevelData,
  type ArrowPathSpec,
  type GridCell,
} from './buildLevelData';

/**
 * mapa-15 — «Anillo» (difícil, 25×25).
 *
 * Tablero con forma de ANILLO (no cuadriculado): el hueco central es
 * sumidero. Radiales que escapan hacia el hueco, dos circulaciones
 * molinete, carriles largos y esquinas asimétricas sin ciclos.
 *
 * Borrador generado para el mapa de niveles extendido; pensado para
 * afinarse en el FORGE (H1) — mismo contrato LevelDataDTO que exporta el
 * editor. Resolubilidad verificada tap a tap en localLevels.spec.ts.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

/** Celdas del anillo: rejilla 25×25 sin el hueco central 9×9 (8..16). */
function ringCells(): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 25; col++) {
      const inHole = col >= 8 && col <= 16 && row >= 8 && row <= 16;
      if (!inHole) {
        cells.push([col, row]);
      }
    }
  }
  return cells;
}

const PATHS: ArrowPathSpec[] = [
  { id: 'borde-left', cells: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12], [0, 13], [0, 14], [0, 15], [0, 16], [0, 17], [0, 18], [0, 19], [0, 20], [0, 21], [0, 22], [0, 23], [0, 24]] },
  { id: 'borde-bottom', cells: [[24, 24], [23, 24], [22, 24], [21, 24], [20, 24], [19, 24], [18, 24], [17, 24], [16, 24], [15, 24], [14, 24], [13, 24], [12, 24], [11, 24], [10, 24], [9, 24], [8, 24], [7, 24], [6, 24], [5, 24], [4, 24], [3, 24], [2, 24], [1, 24]] },
  { id: 'borde-right', cells: [[24, 0], [24, 1], [24, 2], [24, 3], [24, 4], [24, 5], [24, 6], [24, 7], [24, 8], [24, 9], [24, 10], [24, 11], [24, 12], [24, 13], [24, 14], [24, 15], [24, 16], [24, 17], [24, 18], [24, 19], [24, 20], [24, 21], [24, 22], [24, 23]] },
  { id: 'borde-top', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0]] },
  { id: 'brocal-left', cells: [[7, 8], [7, 9], [7, 10], [7, 11], [7, 12], [7, 13], [7, 14], [7, 15], [7, 16], [7, 17]] },
  { id: 'brocal-bottom', cells: [[17, 17], [16, 17], [15, 17], [14, 17], [13, 17], [12, 17], [11, 17], [10, 17], [9, 17], [8, 17]] },
  { id: 'brocal-right', cells: [[17, 7], [17, 8], [17, 9], [17, 10], [17, 11], [17, 12], [17, 13], [17, 14], [17, 15], [17, 16]] },
  { id: 'brocal-top', cells: [[7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7], [15, 7], [16, 7]] },
  { id: 'radial-n10', cells: [[10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6]] },
  { id: 'radial-s10', cells: [[10, 23], [10, 22], [10, 21], [10, 20], [10, 19], [10, 18]] },
  { id: 'radial-n14', cells: [[14, 1], [14, 2], [14, 3], [14, 4], [14, 5], [14, 6]] },
  { id: 'radial-s14', cells: [[14, 23], [14, 22], [14, 21], [14, 20], [14, 19], [14, 18]] },
  { id: 'radial-o10', cells: [[1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10]] },
  { id: 'radial-e10', cells: [[23, 10], [22, 10], [21, 10], [20, 10], [19, 10], [18, 10]] },
  { id: 'radial-o14', cells: [[1, 14], [2, 14], [3, 14], [4, 14], [5, 14], [6, 14]] },
  { id: 'radial-e14', cells: [[23, 14], [22, 14], [21, 14], [20, 14], [19, 14], [18, 14]] },
  { id: 'esquina-no', cells: [[1, 1], [2, 1], [3, 1], [3, 2], [3, 3]] },
  { id: 'esquina-ne', cells: [[23, 1], [23, 2], [23, 3], [22, 3]] },
  { id: 'esquina-se', cells: [[23, 23], [22, 23], [21, 23], [21, 22], [21, 21]] },
  { id: 'esquina-so', cells: [[3, 23], [3, 22], [3, 21], [2, 21], [1, 21]] },
  { id: 'carril-n', cells: [[21, 5], [20, 5], [19, 5], [18, 5], [17, 5]] },
  { id: 'carril-e', cells: [[19, 21], [19, 20], [19, 19], [19, 18], [19, 17]] },
  { id: 'carril-s', cells: [[1, 19], [2, 19], [3, 19], [4, 19]] },
  { id: 'carril-o', cells: [[5, 3], [5, 4], [5, 5], [5, 6], [5, 7]] },
];

export const LEVEL_MAPA_15: LevelDataDTO = {
  ...buildShapedLevelData('mapa-15', 26, ringCells(), PATHS),
  name: 'Anillo',
  difficulty: 'hard',
};
