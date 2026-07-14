import type { LevelConnectionDTO } from '../scene';

/**
 * MODO CUBO — topología de la superficie de un cubo como dato puro.
 *
 * Genera las 6 caras S×S y el cableado de las 12 aristas para el contrato de
 * datos existente (celdas + conexiones puerto-a-puerto). El dominio no cambia:
 * la superficie del cubo es un grafo 4-regular cerrado que el motor ya sabe
 * recorrer; aquí solo se fabrica ese grafo.
 *
 * Decisiones (aprobadas en el plan del MODO CUBO):
 * - Cara = layer (0..5). portCount 4 en todas las celdas.
 * - Ids "col,row" en coordenadas de la cruz desplegada (cube net), únicos y
 *   parseables por sceneFromLevelData:
 *
 *         ┌─────┐
 *         │ top │
 *   ┌─────┼─────┼─────┬─────┐
 *   │left │front│right│back │
 *   └─────┼─────┼─────┴─────┘
 *         │bottm│
 *         └─────┘
 *
 * - Las 12 aristas NO se tejen a mano: cada cara se embebe en el cubo
 *   [0,S]³ (origin + ejes u,v) y dos puertos de borde se conectan cuando el
 *   punto medio de su lado coincide en 3D — correcto por construcción. El
 *   mismo embedding (center 3D por celda, ejes por cara) es la única fuente
 *   de verdad para el renderer 3D y el riel.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type CubeFaceName = 'front' | 'right' | 'back' | 'left' | 'top' | 'bottom';

export interface CubeFace {
  /** Índice de cara — coincide con el campo layer de sus celdas. */
  index: number;
  name: CubeFaceName;
  /** Esquina superior-izquierda del bloque S×S de la cara en la cruz. */
  netOrigin: { col: number; row: number };
  /** Esquina 3D de la celda local (0,0); center = origin + u·(i+½) + v·(j+½). */
  origin: Vec3;
  /** Dirección 3D de +col local (unitaria). */
  u: Vec3;
  /** Dirección 3D de +row local (unitaria). */
  v: Vec3;
  /** Normal exterior de la cara. */
  normal: Vec3;
}

export interface CubeCellData {
  /** "col,row" en coordenadas de la cruz — id global único. */
  id: string;
  col: number;
  row: number;
  /** Índice de cara (0..5). */
  layer: number;
  face: CubeFaceName;
  /** Coordenadas locales dentro de la cara (0..S-1). */
  i: number;
  j: number;
  /** Centro 3D de la celda sobre la piel del cubo [0,S]³. */
  center: Vec3;
}

export interface CubeTopology {
  size: number;
  faces: readonly CubeFace[];
  cells: readonly CubeCellData[];
  /** Todas las conexiones (intra-cara + aristas). */
  connections: readonly LevelConnectionDTO[];
  /** Solo los cruces de arista entre caras (subconjunto de connections). */
  edgeConnections: readonly LevelConnectionDTO[];
  cellById: ReadonlyMap<string, CubeCellData>;
}

/** Deltas locales (i,j) por puerto: 0=N 1=E 2=S 3=O — misma convención del juego. */
const PORT_DELTAS: ReadonlyArray<{ di: number; dj: number }> = [
  { di: 0, dj: -1 },
  { di: 1, dj: 0 },
  { di: 0, dj: 1 },
  { di: -1, dj: 0 },
];

function makeFaces(s: number): CubeFace[] {
  return [
    { index: 0, name: 'front',  netOrigin: { col: s,     row: s },     origin: { x: 0, y: s, z: s }, u: { x: 1,  y: 0, z: 0 },  v: { x: 0, y: -1, z: 0 }, normal: { x: 0,  y: 0,  z: 1 } },
    { index: 1, name: 'right',  netOrigin: { col: 2 * s, row: s },     origin: { x: s, y: s, z: s }, u: { x: 0,  y: 0, z: -1 }, v: { x: 0, y: -1, z: 0 }, normal: { x: 1,  y: 0,  z: 0 } },
    { index: 2, name: 'back',   netOrigin: { col: 3 * s, row: s },     origin: { x: s, y: s, z: 0 }, u: { x: -1, y: 0, z: 0 },  v: { x: 0, y: -1, z: 0 }, normal: { x: 0,  y: 0,  z: -1 } },
    { index: 3, name: 'left',   netOrigin: { col: 0,     row: s },     origin: { x: 0, y: s, z: 0 }, u: { x: 0,  y: 0, z: 1 },  v: { x: 0, y: -1, z: 0 }, normal: { x: -1, y: 0,  z: 0 } },
    { index: 4, name: 'top',    netOrigin: { col: s,     row: 0 },     origin: { x: 0, y: s, z: 0 }, u: { x: 1,  y: 0, z: 0 },  v: { x: 0, y: 0,  z: 1 }, normal: { x: 0,  y: 1,  z: 0 } },
    { index: 5, name: 'bottom', netOrigin: { col: s,     row: 2 * s }, origin: { x: 0, y: 0, z: s }, u: { x: 1,  y: 0, z: 0 },  v: { x: 0, y: 0,  z: -1 }, normal: { x: 0, y: -1, z: 0 } },
  ];
}

function pointAt(face: CubeFace, li: number, lj: number): Vec3 {
  return {
    x: face.origin.x + face.u.x * li + face.v.x * lj,
    y: face.origin.y + face.u.y * li + face.v.y * lj,
    z: face.origin.z + face.u.z * li + face.v.z * lj,
  };
}

/**
 * Clave exacta de un punto 3D cuyas coordenadas son múltiplos de 0.5:
 * se duplican a enteros para eludir cualquier ruido de coma flotante.
 */
function halfStepKey(p: Vec3): string {
  return `${Math.round(p.x * 2)}|${Math.round(p.y * 2)}|${Math.round(p.z * 2)}`;
}

export function buildCubeTopology(size: number): CubeTopology {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError(`buildCubeTopology: tamaño de cara inválido ${size} (entero positivo requerido)`);
  }

  const faces = makeFaces(size);
  const cells: CubeCellData[] = [];
  const cellById = new Map<string, CubeCellData>();
  const grid = new Map<string, CubeCellData>(); // "face:i,j" → celda

  for (const face of faces) {
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const col = face.netOrigin.col + i;
        const row = face.netOrigin.row + j;
        const cell: CubeCellData = {
          id: `${col},${row}`,
          col,
          row,
          layer: face.index,
          face: face.name,
          i,
          j,
          center: pointAt(face, i + 0.5, j + 0.5),
        };
        cells.push(cell);
        cellById.set(cell.id, cell);
        grid.set(`${face.index}:${i},${j}`, cell);
      }
    }
  }

  const connections: LevelConnectionDTO[] = [];
  const edgeConnections: LevelConnectionDTO[] = [];

  // Conexiones intra-cara: cada adyacencia una sola vez (puertos E y S),
  // siempre en pares opuestos (1↔3, 2↔0) como en cualquier nivel plano.
  for (const cell of cells) {
    const east = grid.get(`${cell.layer}:${cell.i + 1},${cell.j}`);
    if (east !== undefined) {
      connections.push({ fromCell: cell.id, fromPort: 1, toCell: east.id, toPort: 3 });
    }
    const south = grid.get(`${cell.layer}:${cell.i},${cell.j + 1}`);
    if (south !== undefined) {
      connections.push({ fromCell: cell.id, fromPort: 2, toCell: south.id, toPort: 0 });
    }
  }

  // Cruces de arista: un puerto de borde apunta fuera de su cara; el punto
  // medio de ese lado de la celda cae SOBRE la arista física del cubo, y
  // exactamente otro puerto de otra cara comparte ese mismo punto.
  const pending = new Map<string, { cellId: string; port: number }>();
  for (const face of faces) {
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const cell = grid.get(`${face.index}:${i},${j}`)!;
        for (let port = 0; port < 4; port++) {
          const { di, dj } = PORT_DELTAS[port];
          const ni = i + di;
          const nj = j + dj;
          if (ni >= 0 && ni < size && nj >= 0 && nj < size) {
            continue; // vecino intra-cara, ya cableado arriba
          }
          const midpoint = pointAt(face, i + 0.5 + di * 0.5, j + 0.5 + dj * 0.5);
          const key = halfStepKey(midpoint);
          const partner = pending.get(key);
          if (partner === undefined) {
            pending.set(key, { cellId: cell.id, port });
          } else {
            pending.delete(key);
            const conn: LevelConnectionDTO = {
              fromCell: partner.cellId,
              fromPort: partner.port,
              toCell: cell.id,
              toPort: port,
            };
            connections.push(conn);
            edgeConnections.push(conn);
          }
        }
      }
    }
  }

  if (pending.size > 0) {
    throw new Error(
      `buildCubeTopology: ${pending.size} puertos de borde quedaron sin pareja — embedding inconsistente`,
    );
  }

  return { size, faces, cells, connections, edgeConnections, cellById };
}
