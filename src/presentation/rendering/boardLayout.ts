export interface Point {
  x: number
  y: number
}

export interface GridDelta {
  dCol: number
  dRow: number
}

export interface GridPosition {
  col: number
  row: number
}

export interface BoardLayout {
  maxCol: number
  maxRow: number
  cellSize: number
  offset: Point
}

export function computeCellSize(
  maxCol: number,
  maxRow: number,
  W: number,
  H: number,
): number {
  const sizeByWidth = W / (maxCol + 1)
  const sizeByHeight = H / (maxRow + 1)
  return Math.max(0, Math.floor(Math.min(sizeByWidth, sizeByHeight)))
}

export function computeOffset(
  maxCol: number,
  maxRow: number,
  cellSize: number,
  W: number,
  H: number,
): Point {
  const contentWidth = maxCol * cellSize
  const contentHeight = maxRow * cellSize
  return {
    x: (W - contentWidth) / 2,
    y: (H - contentHeight) / 2,
  }
}

export function cellCenter(
  col: number,
  row: number,
  cellSize: number,
  offset: Point,
): Point {
  return {
    x: col * cellSize + offset.x,
    y: row * cellSize + offset.y,
  }
}

export function boundingBoxPositions(maxCol: number, maxRow: number): GridPosition[] {
  const positions: GridPosition[] = []
  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col <= maxCol; col++) {
      positions.push({ col, row })
    }
  }
  return positions
}

export function computeBoardLayout(
  cells: ReadonlyArray<{ col: number; row: number }>,
  W: number,
  H: number,
): BoardLayout {
  const maxCol = cells.reduce((max, c) => Math.max(max, c.col), -1)
  const maxRow = cells.reduce((max, c) => Math.max(max, c.row), -1)

  if (maxCol < 0 || maxRow < 0) {
    return { maxCol, maxRow, cellSize: 0, offset: { x: W / 2, y: H / 2 } }
  }

  const cellSize = computeCellSize(maxCol, maxRow, W, H)
  const offset = computeOffset(maxCol, maxRow, cellSize, W, H)
  return { maxCol, maxRow, cellSize, offset }
}

export function screenToCell(
  point: Point,
  cellSize: number,
  offset: Point,
  maxCol: number,
  maxRow: number,
): GridPosition | null {
  if (cellSize <= 0) {
    return null
  }
  const col = Math.round((point.x - offset.x) / cellSize)
  const row = Math.round((point.y - offset.y) / cellSize)
  if (col < 0 || col > maxCol || row < 0 || row > maxRow) {
    return null
  }
  return { col, row }
}

export function portDelta(port: number): GridDelta {
  switch (port) {
    case 0:
      return { dCol: 0, dRow: -1 } // N
    case 1:
      return { dCol: 1, dRow: 0 } // E
    case 2:
      return { dCol: 0, dRow: 1 } // S
    case 3:
      return { dCol: -1, dRow: 0 } // O
    default:
      throw new RangeError(
        `portDelta: índice de puerto ${port} fuera de rango [0, 3]`,
      )
  }
}
