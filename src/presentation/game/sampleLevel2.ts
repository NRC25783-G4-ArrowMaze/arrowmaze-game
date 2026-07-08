import type { Scene, SceneArrow, SceneCell } from './scene';
import type { LevelConnectionDTO } from '../../application/dtos/LevelDataDTOs';

/**
 * sampleLevel2 — Segundo nivel de ejemplo para la app principal.
 *
 * Tablero 6×6 totalmente conectado (celdas de 4 puertos) y COMPLETAMENTE poblado:
 * las 36 celdas quedan cubiertas por 8 flechas de formas VARIADAS (en "U", en "L",
 * en "escalera" y en zigzag), de largo 4–6 celdas. El id de cada celda es "col,row".
 *
 * Presupuesto de movimientos = nº de flechas + 5.
 *
 * Comportamiento de colisión: 'return' es el DEFAULT del motor (la flecha que choca
 * se devuelve a su origen).
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O. El cuerpo se dispone en la
 * dirección del exitPort (adelante de la cabeza, en el sentido de avance).
 */

const COLS = 6;
const ROWS = 6;

type Cell = [number, number];

const idOf = (c: Cell): string => `${c[0]},${c[1]}`;

/** Puerto de salida de `a` hacia `b` (deben ser ortogonalmente adyacentes). */
function dirPort(a: Cell, b: Cell): number {
  const dc = b[0] - a[0];
  const dr = b[1] - a[1];
  if (dc === 0 && dr === -1) return 0; // N
  if (dc === 1 && dr === 0) return 1; // E
  if (dc === 0 && dr === 1) return 2; // S
  if (dc === -1 && dr === 0) return 3; // O
  throw new Error(`celdas no adyacentes en un camino: [${a}] -> [${b}]`);
}

function buildGridCells(): SceneCell[] {
  const cells: SceneCell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ id: `${col},${row}`, col, row, portCount: 4 });
    }
  }
  return cells;
}

function buildGridConnections(): LevelConnectionDTO[] {
  const connections: LevelConnectionDTO[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = `${col},${row}`;
      if (col < COLS - 1) {
        connections.push({ fromCell: id, fromPort: 1, toCell: `${col + 1},${row}`, toPort: 3 });
      }
      if (row < ROWS - 1) {
        connections.push({ fromCell: id, fromPort: 2, toCell: `${col},${row + 1}`, toPort: 0 });
      }
    }
  }
  return connections;
}

/** Un camino de flecha: celdas en orden cabeza→punta (cada par debe ser adyacente). */
interface ArrowPath {
  id: string;
  color: string;
  cells: Cell[];
}

function toSceneArrow(p: ArrowPath): SceneArrow {
  return {
    id: p.id,
    color: p.color,
    head: { cellId: idOf(p.cells[0]), exitPort: dirPort(p.cells[0], p.cells[1]) },
    body: p.cells.slice(1).map(idOf),
  };
}

/**
 * Teselado del 6×6: 8 caminos de formas distintas que cubren las 36 celdas sin
 * solaparse (verificado celda a celda).
 */
const PATHS: ArrowPath[] = [
  // Gancho largo (6) — esquina superior izquierda.
  { id: 'blue', color: '#3b82f6', cells: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [0, 3]] },
  // U (5) — centro-arriba.
  { id: 'green', color: '#22c55e', cells: [[2, 0], [3, 0], [3, 1], [2, 1], [2, 2]] },
  // L (4) — borde derecho.
  { id: 'orange', color: '#f97316', cells: [[4, 0], [5, 0], [5, 1], [5, 2]] },
  // Zigzag (4) — centro.
  { id: 'magenta', color: '#ec4899', cells: [[4, 1], [4, 2], [3, 2], [3, 3]] },
  // Escalera (4) — centro-izquierda.
  { id: 'violet', color: '#8b5cf6', cells: [[1, 2], [1, 3], [2, 3], [2, 4]] },
  // L (4) — borde inferior derecho.
  { id: 'cyan', color: '#06b6d4', cells: [[4, 3], [5, 3], [5, 4], [5, 5]] },
  // U cuadrada (4) — esquina inferior izquierda; la punta mira al Este.
  { id: 'amber', color: '#f59e0b', cells: [[1, 5], [0, 5], [0, 4], [1, 4]] },
  // Zigzag (5) — borde inferior.
  { id: 'rose', color: '#fb7185', cells: [[2, 5], [3, 5], [3, 4], [4, 4], [4, 5]] },
];

export const SAMPLE_LEVEL_2: Scene = {
  id: 'sample-level-2',
  allowedMoves: PATHS.length + 5,
  cells: buildGridCells(),
  connections: buildGridConnections(),
  arrows: PATHS.map(toSceneArrow),
};
