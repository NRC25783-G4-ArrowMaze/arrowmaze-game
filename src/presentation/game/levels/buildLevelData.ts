import type {
  LevelArrowDTO,
  LevelCellDTO,
  LevelConnectionDTO,
  LevelDataDTO,
} from '../scene';

/**
 * buildLevelData — Constructor de niveles locales en formato LevelDataDTO.
 *
 * Produce el MISMO contrato que exporta el FORGE (PublishPanel) y que sirve la
 * API de niveles (C2/F2): rejilla totalmente conectada de celdas de 4 puertos
 * con id "col,row", y flechas definidas como caminos cabeza→punta. Cualquier
 * nivel de este módulo puede reemplazarse por un JSON exportado del FORGE sin
 * tocar el resto del código (ambos pasan por sceneFromLevelData).
 *
 * Convención de puertos (B1): 0=N, 1=E, 2=S, 3=O. El cuerpo se dispone en la
 * dirección del exitPort (adelante de la cabeza, en el sentido de avance).
 */

/** Posición de rejilla [col, row]. */
export type GridCell = [number, number];

/** Un camino de flecha: celdas en orden cabeza→punta (pares adyacentes). */
export interface ArrowPathSpec {
  id: string;
  cells: GridCell[];
}

const idOf = (c: GridCell): string => `${c[0]},${c[1]}`;

/** Puerto de salida de `a` hacia `b` (deben ser ortogonalmente adyacentes). */
function dirPort(a: GridCell, b: GridCell): number {
  const dc = b[0] - a[0];
  const dr = b[1] - a[1];
  if (dc === 0 && dr === -1) return 0; // N
  if (dc === 1 && dr === 0) return 1; // E
  if (dc === 0 && dr === 1) return 2; // S
  if (dc === -1 && dr === 0) return 3; // O
  throw new Error(`celdas no adyacentes en un camino: [${a}] -> [${b}]`);
}

function buildGridCells(cols: number, rows: number): LevelCellDTO[] {
  const cells: LevelCellDTO[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({ id: `${col},${row}`, portCount: 4 });
    }
  }
  return cells;
}

function buildGridConnections(cols: number, rows: number): LevelConnectionDTO[] {
  const connections: LevelConnectionDTO[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = `${col},${row}`;
      if (col < cols - 1) {
        connections.push({ fromCell: id, fromPort: 1, toCell: `${col + 1},${row}`, toPort: 3 });
      }
      if (row < rows - 1) {
        connections.push({ fromCell: id, fromPort: 2, toCell: `${col},${row + 1}`, toPort: 0 });
      }
    }
  }
  return connections;
}

function toArrowDTO(p: ArrowPathSpec): LevelArrowDTO {
  if (p.cells.length < 2) {
    throw new Error(`la flecha "${p.id}" necesita al menos cabeza y un segmento`);
  }
  return {
    id: p.id,
    head: { cellId: idOf(p.cells[0]), exitPort: dirPort(p.cells[0], p.cells[1]) },
    body: p.cells.slice(1).map(idOf),
  };
}

/**
 * Ensambla un LevelDataDTO sobre una forma ARBITRARIA de celdas (no
 * necesariamente rectangular, p. ej. rombo o anillo): las conexiones se crean
 * solo entre celdas ortogonalmente adyacentes presentes en la forma, así el
 * contorno de la forma actúa como sumidero (igual que el borde de la rejilla).
 */
export function buildShapedLevelData(
  id: string,
  allowedMoves: number,
  shape: GridCell[],
  paths: ArrowPathSpec[],
): LevelDataDTO {
  const present = new Set(shape.map(idOf));
  const occupied = new Set<string>();
  for (const p of paths) {
    for (const c of p.cells) {
      const key = idOf(c);
      if (!present.has(key)) {
        throw new Error(`la flecha "${p.id}" pisa ${key}, fuera de la forma`);
      }
      if (occupied.has(key)) {
        throw new Error(`celda ${key} ocupada por dos flechas (incluye "${p.id}")`);
      }
      occupied.add(key);
    }
  }

  const connections: LevelConnectionDTO[] = [];
  for (const [col, row] of shape) {
    if (present.has(`${col + 1},${row}`)) {
      connections.push({ fromCell: `${col},${row}`, fromPort: 1, toCell: `${col + 1},${row}`, toPort: 3 });
    }
    if (present.has(`${col},${row + 1}`)) {
      connections.push({ fromCell: `${col},${row}`, fromPort: 2, toCell: `${col},${row + 1}`, toPort: 0 });
    }
  }

  return {
    id,
    allowedMoves,
    cells: shape.map((c) => ({ id: idOf(c), portCount: 4 })),
    connections,
    arrows: paths.map(toArrowDTO),
  };
}

/**
 * Ensambla un LevelDataDTO de rejilla cols×rows validando que los caminos no
 * se solapen entre sí ni se salgan del tablero.
 */
export function buildLevelData(
  id: string,
  allowedMoves: number,
  cols: number,
  rows: number,
  paths: ArrowPathSpec[],
): LevelDataDTO {
  const occupied = new Set<string>();
  for (const p of paths) {
    for (const c of p.cells) {
      if (c[0] < 0 || c[0] >= cols || c[1] < 0 || c[1] >= rows) {
        throw new Error(`la flecha "${p.id}" se sale del tablero en [${c}]`);
      }
      const key = idOf(c);
      if (occupied.has(key)) {
        throw new Error(`celda ${key} ocupada por dos flechas (incluye "${p.id}")`);
      }
      occupied.add(key);
    }
  }

  return {
    id,
    allowedMoves,
    cells: buildGridCells(cols, rows),
    connections: buildGridConnections(cols, rows),
    arrows: paths.map(toArrowDTO),
  };
}
