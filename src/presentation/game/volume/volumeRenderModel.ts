export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface VolumeRenderTile {
  id: string;
  center: Vec3;
}

export interface VolumeRenderArrow {
  id: string;
  color: string;
  /** Centros de las celdas ocupadas, desde la cabeza hasta la cola */
  points: Vec3[];
}

export interface VolumeRenderModel {
  tiles: VolumeRenderTile[];
  arrows: VolumeRenderArrow[];
}

/**
 * Convierte coordenadas lógicas del grid (col, row, layer) a coordenadas
 * físicas 3D para el renderizador volumétrico.
 * 
 * Asumimos un grid 3x3x3 centrado en (0,0,0):
 * - col 0..2 -> x: -1, 0, 1
 * - layer 0..2 -> y: 1, 0, -1 (layer 0 es la superior)
 * - row 0..2 -> z: -1, 0, 1 (row 0 es el fondo)
 */
export function cellToVolumePos(col: number, row: number, layer: number): Vec3 {
  return {
    x: col - 1,
    y: 1 - layer,
    z: row - 1,
  };
}

export function buildVolumeRenderModel(
  cells: ReadonlyArray<{ id: string; col: number; row: number; layer?: number }>,
  arrows: ReadonlyArray<{ id: string; color: string; cellIds: string[] }>
): VolumeRenderModel {
  const cellMap = new Map<string, Vec3>();
  const tiles: VolumeRenderTile[] = [];

  for (const cell of cells) {
    const center = cellToVolumePos(cell.col, cell.row, cell.layer ?? 0);
    cellMap.set(cell.id, center);
    tiles.push({ id: cell.id, center });
  }

  const renderArrows: VolumeRenderArrow[] = [];
  for (const arrow of arrows) {
    const points: Vec3[] = [];
    for (const cellId of arrow.cellIds) {
      const center = cellMap.get(cellId);
      if (center) {
        points.push(center);
      }
    }
    if (points.length > 0) {
      renderArrows.push({
        id: arrow.id,
        color: arrow.color,
        points,
      });
    }
  }

  return { tiles, arrows: renderArrows };
}
