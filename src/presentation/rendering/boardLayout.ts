/**
 * boardLayout — Funciones PURAS de cálculo geométrico para el renderizado del tablero.
 *
 * No dependen de React ni del DOM. Traducen las coordenadas de rejilla (col, row)
 * que viajan en el view-model de presentación a coordenadas de pantalla en píxeles,
 * y resuelven el ajuste del tablero al viewport.
 *
 * REGLA (spec B1): el renderer NO infiere, calcula ni inventa datos posicionales.
 * col/row llegan dados desde el view-model; aquí solo se hace aritmética determinista.
 *
 * Ámbito B1: celdas cuadradas con portCount = 4 (mapeo puerto→dirección cardinal).
 */

/** Punto en coordenadas de pantalla (píxeles). */
export interface Point {
  x: number;
  y: number;
}

/** Delta unitario en coordenadas de rejilla (columnas, filas). */
export interface GridDelta {
  dCol: number;
  dRow: number;
}

/** Posición discreta dentro de la rejilla (base 0). */
export interface GridPosition {
  col: number;
  row: number;
}

/**
 * Calcula el tamaño de celda (cellSize) que ajusta el tablero al viewport.
 *
 * Devuelve el mayor entero `size` tal que:
 *   (maxCol + 1) * size <= W   y   (maxRow + 1) * size <= H
 *
 * @param maxCol - Columna máxima presente en el tablero (índice, base 0).
 * @param maxRow - Fila máxima presente en el tablero (índice, base 0).
 * @param W - Ancho del viewport SVG en píxeles.
 * @param H - Alto del viewport SVG en píxeles.
 * @returns El mayor entero de cellSize que cabe en ambos ejes (>= 0).
 */
export function computeCellSize(
  maxCol: number,
  maxRow: number,
  W: number,
  H: number,
): number {
  const sizeByWidth = W / (maxCol + 1);
  const sizeByHeight = H / (maxRow + 1);
  return Math.max(0, Math.floor(Math.min(sizeByWidth, sizeByHeight)));
}

/**
 * Calcula el offset de centrado del tablero dentro del viewport.
 *
 * Centra la rejilla de centros de celda (que abarca de 0 a maxCol*cellSize en X
 * y de 0 a maxRow*cellSize en Y) dejando márgenes iguales en el eje sobrante.
 *
 * @returns Offset {x, y} a sumar a cada centro de celda.
 */
export function computeOffset(
  maxCol: number,
  maxRow: number,
  cellSize: number,
  W: number,
  H: number,
): Point {
  const contentWidth = maxCol * cellSize;
  const contentHeight = maxRow * cellSize;
  return {
    x: (W - contentWidth) / 2,
    y: (H - contentHeight) / 2,
  };
}

/**
 * Centro en pantalla de una celda dada su posición de rejilla.
 *
 * Por spec B1: el centro deriva EXACTAMENTE de col/row → (col*cellSize, row*cellSize),
 * más el offset de centrado del tablero. No se consulta ninguna otra fuente de posición.
 *
 * @param col - Columna de la celda (base 0).
 * @param row - Fila de la celda (base 0).
 * @param cellSize - Tamaño de celda en píxeles.
 * @param offset - Offset de centrado del tablero (ver computeOffset).
 */
export function cellCenter(
  col: number,
  row: number,
  cellSize: number,
  offset: Point,
): Point {
  return {
    x: col * cellSize + offset.x,
    y: row * cellSize + offset.y,
  };
}

/**
 * Enumera todas las posiciones del bounding box [0..maxCol] × [0..maxRow].
 *
 * Look de referencia: el fondo es una grilla COMPLETA de puntos sobre el
 * rectángulo que envuelve al tablero (no solo donde hay celdas). Esta función
 * pura genera esas posiciones en orden fila-mayor para que la capa de
 * presentación pinte un punto por cada una (Pasada 1).
 *
 * @param maxCol - Columna máxima (índice, base 0). Negativo → rejilla vacía.
 * @param maxRow - Fila máxima (índice, base 0). Negativo → rejilla vacía.
 */
export function boundingBoxPositions(
  maxCol: number,
  maxRow: number,
): GridPosition[] {
  const positions: GridPosition[] = [];
  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col <= maxCol; col++) {
      positions.push({ col, row });
    }
  }
  return positions;
}

/**
 * Geometría resuelta del tablero para un viewport dado.
 * Compartida por el renderer (B1) y el adaptador de input (B3) para que ambos
 * usen EXACTAMENTE el mismo cellSize/offset y no haya deriva entre lo que se
 * pinta y dónde se detecta el toque.
 */
export interface BoardLayout {
  maxCol: number;
  maxRow: number;
  cellSize: number;
  offset: Point;
}

/**
 * Resuelve el bounding box y el ajuste al viewport a partir de las celdas.
 *
 * @param cells - Celdas con su posición de rejilla (solo se leen col/row).
 * @param W - Ancho del viewport SVG en píxeles.
 * @param H - Alto del viewport SVG en píxeles.
 * @returns Layout con maxCol/maxRow, cellSize entero y offset de centrado.
 *          Tablero sin celdas → cellSize 0 y offset al centro del viewport.
 */
export function computeBoardLayout(
  cells: ReadonlyArray<{ col: number; row: number }>,
  W: number,
  H: number,
): BoardLayout {
  const maxCol = cells.reduce((max, c) => Math.max(max, c.col), -1);
  const maxRow = cells.reduce((max, c) => Math.max(max, c.row), -1);

  if (maxCol < 0 || maxRow < 0) {
    return { maxCol, maxRow, cellSize: 0, offset: { x: W / 2, y: H / 2 } };
  }

  const cellSize = computeCellSize(maxCol, maxRow, W, H);
  const offset = computeOffset(maxCol, maxRow, cellSize, W, H);
  return { maxCol, maxRow, cellSize, offset };
}

/**
 * Invierte un punto de pantalla (en unidades del viewBox) a su posición de
 * rejilla (col, row). Es la inversa exacta de cellCenter(): se resta el offset
 * y se divide por cellSize, redondeando al centro de celda más cercano.
 *
 * Devuelve null cuando el punto cae FUERA del bounding box del tablero o cuando
 * cellSize es 0 (tablero vacío). NO consulta ocupación: solo geometría.
 *
 * @param point - Punto en coordenadas del viewBox (mismas unidades que cellCenter).
 * @param cellSize - Tamaño de celda en píxeles.
 * @param offset - Offset de centrado del tablero (ver computeOffset).
 * @param maxCol - Columna máxima del bounding box (base 0).
 * @param maxRow - Fila máxima del bounding box (base 0).
 */
export function screenToCell(
  point: Point,
  cellSize: number,
  offset: Point,
  maxCol: number,
  maxRow: number,
): GridPosition | null {
  if (cellSize <= 0) {
    return null;
  }
  const col = Math.round((point.x - offset.x) / cellSize);
  const row = Math.round((point.y - offset.y) / cellSize);
  if (col < 0 || col > maxCol || row < 0 || row > maxRow) {
    return null;
  }
  return { col, row };
}

/**
 * Mapeo puerto → delta unitario de rejilla (convención de la capa de presentación).
 *
 * El dominio usa los índices de puerto de forma abstracta; SOLO el renderer los
 * interpreta como direcciones cardinales. Mapeo fijo para portCount = 4:
 *   0 = Norte  (0, -1)
 *   1 = Este   (+1, 0)
 *   2 = Sur    (0, +1)
 *   3 = Oeste  (-1, 0)
 *
 * @param port - Índice de puerto en el rango [0, 3].
 * @throws {RangeError} si el puerto está fuera de [0, 3] (B1 solo soporta P=4).
 */
export function portDelta(port: number): GridDelta {
  switch (port) {
    case 0:
      return { dCol: 0, dRow: -1 };
    case 1:
      return { dCol: 1, dRow: 0 };
    case 2:
      return { dCol: 0, dRow: 1 };
    case 3:
      return { dCol: -1, dRow: 0 };
    default:
      throw new RangeError(
        `portDelta: índice de puerto ${port} fuera de rango [0, 3] (B1 solo soporta portCount = 4)`,
      );
  }
}
