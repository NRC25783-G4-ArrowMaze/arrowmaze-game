import type { BoardViewModel } from '../../viewModel';
import type { CubeTopology, Vec3 } from './cubeTopology';
import { portDelta } from '../../rendering/boardLayout';

/**
 * cubeRenderModel — Proyección pura del estado del juego a datos 3D.
 *
 * Traduce (topología del cubo + BoardViewModel del GameController) a
 * posiciones/orientaciones listas para el renderer three.js, sin importar
 * three: todo es matemática de Vec3 testeable en jsdom. El renderer consume
 * este modelo tal cual; la MISMA fuente de datos que alimenta el SVG 2D.
 *
 * - tiles: celdas jugables presentes en la escena.
 * - holes: posiciones de la topología SIN celda en la escena — la región del
 *   agujero negro (placeholder oscuro en Fase 3; estética fina en Fase 5).
 * - arrows: polilínea 3D de celdas ocupadas (cabeza→cola del dominio; la
 *   punta visual es el ÚLTIMO punto, como en el SVG) elevada sobre la piel
 *   del cubo, más posición/dirección de la punta.
 */

/**
 * Elevación de las flechas sobre la piel del cubo (unidades de celda).
 * Por encima de la tapa de los bloques (a ras, +0.04) para que el riel y
 * los hit-targets viajen sobre las piezas, no dentro de ellas.
 */
export const ARROW_LIFT = 0.16;

export interface CubeRenderTile {
  id: string;
  center: Vec3;
  normal: Vec3;
  u: Vec3;
  v: Vec3;
  layer: number;
}

export interface CubeRenderArrow {
  id: string;
  color: string;
  /** Centros elevados de las celdas ocupadas, cabeza→cola. */
  points: Vec3[];
  /** Posición de la punta visual (último punto). */
  tipPos: Vec3;
  /** Dirección unitaria de la punta. */
  tipDir: Vec3;
}

export interface CubeRenderModel {
  size: number;
  tiles: CubeRenderTile[];
  holes: CubeRenderTile[];
  arrows: CubeRenderArrow[];
}

function add(a: Vec3, b: Vec3, scale: number = 1): Vec3 {
  return { x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale };
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Tamaño de cara S deducido de la extensión de la cruz desplegada:
 * la cruz ocupa 4S columnas × 3S filas. Lanza si las celdas no encajan.
 */
export function cubeSizeFromNet(
  cells: ReadonlyArray<{ col: number; row: number }>,
): number {
  if (cells.length === 0) {
    throw new RangeError('cubeSizeFromNet: escena sin celdas');
  }
  const maxCol = cells.reduce((m, c) => Math.max(m, c.col), 0);
  const maxRow = cells.reduce((m, c) => Math.max(m, c.row), 0);
  const size = (maxCol + 1) / 4;
  if (!Number.isInteger(size) || size < 1 || maxRow + 1 !== 3 * size) {
    throw new RangeError(
      `cubeSizeFromNet: extensión ${maxCol + 1}×${maxRow + 1} no corresponde a una cruz 4S×3S`,
    );
  }
  return size;
}

function tileOf(topo: CubeTopology, cellId: string): CubeRenderTile | null {
  const cell = topo.cellById.get(cellId);
  if (cell === undefined) {
    return null;
  }
  const face = topo.faces[cell.layer];
  return {
    id: cell.id,
    center: cell.center,
    normal: face.normal,
    u: face.u,
    v: face.v,
    layer: cell.layer,
  };
}

export function buildCubeRenderModel(
  topo: CubeTopology,
  board: BoardViewModel,
): CubeRenderModel {
  const presentIds = new Set(board.cells.map((c) => c.id));

  const tiles: CubeRenderTile[] = [];
  const holes: CubeRenderTile[] = [];
  for (const cell of topo.cells) {
    const tile = tileOf(topo, cell.id);
    if (tile === null) {
      continue;
    }
    if (presentIds.has(cell.id)) {
      tiles.push(tile);
    } else {
      holes.push(tile);
    }
  }

  const arrows: CubeRenderArrow[] = [];
  for (const arrow of board.arrows) {
    const points: Vec3[] = [];
    for (const cellId of arrow.cellIds) {
      const cell = topo.cellById.get(cellId);
      if (cell === undefined) {
        continue; // celda fuera de la topología: se omite, jamás se revienta
      }
      points.push(add(cell.center, topo.faces[cell.layer].normal, ARROW_LIFT));
    }
    if (points.length === 0) {
      continue;
    }

    const tipPos = points[points.length - 1];
    let tipDir: Vec3;
    if (points.length >= 2) {
      const prev = points[points.length - 2];
      tipDir = normalize(add(tipPos, prev, -1));
    } else {
      // Flecha de una sola celda: la dirección sale del exitPort proyectado
      // en el marco (u,v) de su cara.
      const cell = topo.cellById.get(arrow.cellIds[arrow.cellIds.length - 1])!;
      const face = topo.faces[cell.layer];
      const delta = portDelta(arrow.exitDir);
      tipDir = normalize(add(
        { x: face.u.x * delta.dCol, y: face.u.y * delta.dCol, z: face.u.z * delta.dCol },
        face.v,
        delta.dRow,
      ));
    }

    arrows.push({ id: arrow.id, color: arrow.color, points, tipPos, tipDir });
  }

  return { size: topo.size, tiles, holes, arrows };
}
