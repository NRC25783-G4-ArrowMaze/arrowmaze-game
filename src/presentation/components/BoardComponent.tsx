import React from 'react';
import {
  computeBoardLayout,
  cellCenter,
  boundingBoxPositions,
  type Point,
} from '../rendering/boardLayout';
import { CellComponent } from './CellComponent';
import { ArrowComponent } from './ArrowComponent';
import { BOARD_BACKGROUND, DOT_RADIUS_RATIO } from '../theme';
import type { BoardViewModel } from '../viewModel';
import type { ArrowMotion } from '../animation/motion';

// Re-export por compatibilidad: los tipos del view-model viven en ../viewModel.
export type { CellView, ArrowView, BoardViewModel } from '../viewModel';

/** Props de BoardComponent: view-model + dimensiones del viewport. */
export interface BoardComponentProps {
  board: BoardViewModel;
  width: number;
  height: number;
  /**
   * Handler de toque sobre el lienzo (B3). Opcional: en render estático (B1)
   * no se pasa. La capa de input resuelve (col,row) y la flecha tocada.
   */
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
  /**
   * Planes de animación por id de flecha (B2). Solo la flecha del tick en curso
   * aparece aquí; las demás se dibujan estáticas. Ausente → todo estático (B1).
   */
  motions?: ReadonlyMap<string, ArrowMotion>;
}

/**
 * BoardComponent — Lienzo SVG raíz del tablero (look de referencia, tema claro).
 *
 * Calcula cellSize/offset a partir del bounding box del tablero y el viewport,
 * y ejecuta el renderizado en DOS pasadas ordenadas (spec B1):
 *   Pasada 1: una grilla de puntos gris claro sobre TODO el bounding box.
 *   Pasada 2: cada flecha encima de los puntos (orden del DOM = orden de pintado).
 *
 * Un tablero sin flechas produce únicamente la Pasada 1 (la grilla de puntos).
 */
export const BoardComponent: React.FC<BoardComponentProps> = ({
  board,
  width,
  height,
  onPointerDown,
  motions,
}) => {
  const { cells, arrows } = board;

  // Layout compartido con la capa de input (mismo cellSize/offset).
  const { maxCol, maxRow, cellSize, offset } = computeBoardLayout(
    cells,
    width,
    height,
  );
  const dotRadius = cellSize * DOT_RADIUS_RATIO;

  // Índice id → centro en pantalla, para resolver las celdas de cada flecha.
  const centerById = new Map<string, Point>(
    cells.map((c) => [c.id, cellCenter(c.col, c.row, cellSize, offset)]),
  );

  // Grilla completa de puntos: una posición por celda del bounding box.
  const dotPositions = boundingBoxPositions(maxCol, maxRow);

  return (
    <svg
      data-testid="board"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onPointerDown={onPointerDown}
      style={{ touchAction: 'none' }}
    >
      {/* Fondo blanco a pantalla completa (tema claro). */}
      <rect
        data-testid="board-background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill={BOARD_BACKGROUND}
      />

      {/* Pasada 1: grilla de puntos sobre todo el bounding box. */}
      <g data-testid="pass-cells">
        {dotPositions.map(({ col, row }) => (
          <CellComponent
            key={`${col},${row}`}
            center={cellCenter(col, row, cellSize, offset)}
            radius={dotRadius}
          />
        ))}
      </g>

      {/* Pasada 2: cada flecha encima de los puntos. */}
      <g data-testid="pass-arrows">
        {arrows.map((arrow) => {
          const centers = arrow.cellIds
            .map((id) => centerById.get(id))
            .filter((p): p is Point => p !== undefined);
          return (
            <ArrowComponent
              key={arrow.id}
              color={arrow.color}
              centers={centers}
              exitDir={arrow.exitDir}
              cellSize={cellSize}
              motion={motions?.get(arrow.id)}
            />
          );
        })}
      </g>
    </svg>
  );
};
