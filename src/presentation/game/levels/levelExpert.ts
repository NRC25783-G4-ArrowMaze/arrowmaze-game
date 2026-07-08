import type { LevelDataDTO } from '../scene';
import { buildLevelData, type ArrowPathSpec } from './buildLevelData';

/**
 * level-expert — "Experto" (dificultad máxima).
 *
 * Tablero 7×7 con DOS molinetes anidados y un núcleo 3×3. Cada anillo es un
 * molinete roto: el exterior escapa por la izquierda ('outer-left' sale S por
 * el borde) y el interior no escapa por sí mismo — su llave ('inner-left')
 * atraviesa la fila que libera 'outer-bottom'. El núcleo depende de ambos
 * anillos ('core-hook' del inferior interno, 'core-tail' además del gancho).
 * Cadena de dependencias de profundidad ~6 y margen de 2 movimientos.
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O.
 */

const PATHS: ArrowPathSpec[] = [
  // ── Anillo exterior (lados de 6) ──────────────────────────────────────
  // Izquierda: escapa directa al S por el borde (la llave de todo el nivel).
  { id: 'outer-left', cells: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
  // Inferior: escapa al O por la celda que libera 'outer-left'.
  { id: 'outer-bottom', cells: [[6, 6], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6]] },
  // Derecha: escapa al S por la celda que libera 'outer-bottom'.
  { id: 'outer-right', cells: [[6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5]] },
  // Superior: escapa al E por la celda que libera 'outer-right'.
  { id: 'outer-top', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
  // ── Anillo interior (lados de 4) ──────────────────────────────────────
  // Izquierda interior: escapa al S atravesando la fila de 'outer-bottom'.
  { id: 'inner-left', cells: [[1, 2], [1, 3], [1, 4], [1, 5]] },
  // Inferior interior: escapa al O por la celda que libera 'inner-left'.
  { id: 'inner-bottom', cells: [[5, 5], [4, 5], [3, 5], [2, 5]] },
  // Derecha interior: escapa al S por la celda que libera 'inner-bottom'.
  { id: 'inner-right', cells: [[5, 1], [5, 2], [5, 3], [5, 4]] },
  // Superior interior: escapa al E por la celda que libera 'inner-right'.
  { id: 'inner-top', cells: [[1, 1], [2, 1], [3, 1], [4, 1]] },
  // ── Núcleo 3×3 ────────────────────────────────────────────────────────
  // Gancho: escapa al S atravesando ambos anillos inferiores.
  { id: 'core-hook', cells: [[2, 2], [3, 2], [4, 2], [4, 3], [4, 4]] },
  // Cola: escapa al E atravesando el gancho y ambos anillos derechos.
  { id: 'core-tail', cells: [[3, 3], [2, 3], [2, 4], [3, 4]] },
];

export const LEVEL_EXPERT: LevelDataDTO = buildLevelData(
  'level-expert',
  PATHS.length + 2,
  7,
  7,
  PATHS,
);
