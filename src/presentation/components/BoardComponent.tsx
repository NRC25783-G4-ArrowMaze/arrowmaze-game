import React from 'react';
import {
  computeBoardLayout,
  cellCenter,
  boundingBoxPositions,
  portDelta,
  type Point,
} from '../rendering/boardLayout';
import { CellComponent } from './CellComponent';
import { ArrowComponent } from './ArrowComponent';
import { ArrowBurst } from './ArrowBurst';
import { ArrowHeadDisintegrate } from './ArrowHeadDisintegrate';
import { BOARD_BACKGROUND, DOT_RADIUS_RATIO } from '../theme';
import type { BoardViewModel } from '../viewModel';

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
   * Última colisión: la flecha cuyo `arrowId` coincide rebota (recoil). El
   * `nonce` cambia en cada choque para re-disparar la animación. Ausente → sin rebote.
   */
  collision?: { arrowId: string; nonce: number };
  /**
   * Última desaparición: estalla chispas en la celda-cabeza (cellIds[0]) de la
   * flecha que se destruyó. El `nonce` re-dispara el estallido. Ausente → sin estallido.
   */
  vanishing?: { color: string; cellIds: string[]; nonce: number };
  /**
   * Cabeza desintegrándose justo antes del burst: el triángulo se quiebra/erosiona.
   * Renderiza la punta en su última posición con efecto de fracturas. Ausente → sin efecto.
   */
  headDisintegrating?: { color: string; cellId: string; exitDir: number; nonce: number };
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
  collision,
  vanishing,
  headDisintegrating,
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

  // Origen del estallido de desaparición (cabeza de la flecha destruida), si lo hay.
  const burstOrigin =
    vanishing !== undefined ? centerById.get(vanishing.cellIds[0]) : undefined;

  // Origen de la desintegración de la punta.
  const headDisintegrateOrigin =
    headDisintegrating !== undefined
      ? centerById.get(headDisintegrating.cellId)
      : undefined;

  return (
    <svg
      data-testid="board"
      // width/height son las unidades LÓGICAS del viewBox; el elemento llena su
      // contenedor y escala el contenido (el input ya reescala en toViewBoxPoint).
      viewBox={`0 0 ${width} ${height}`}
      onPointerDown={onPointerDown}
      style={{ touchAction: 'none', display: 'block', width: '100%', height: '100%' }}
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
              collideNonce={
                collision?.arrowId === arrow.id ? collision.nonce : undefined
              }
            />
          );
        })}
      </g>

      {/* Desintegración de la punta: fractura que precede al estallido. */}
      {headDisintegrating !== undefined && headDisintegrateOrigin !== undefined && (
        (() => {
          const { dCol, dRow } = portDelta(headDisintegrating.exitDir);
          return (
            <ArrowHeadDisintegrate
              key={headDisintegrating.nonce}
              center={headDisintegrateOrigin}
              color={headDisintegrating.color}
              cellSize={cellSize}
              tipDir={{ x: dCol, y: dRow }}
            />
          );
        })()
      )}

      {/* Estallido de desaparición: chispas en la cabeza de la flecha destruida. */}
      {vanishing !== undefined && burstOrigin !== undefined && (
        <ArrowBurst
          key={vanishing.nonce}
          origin={burstOrigin}
          color={vanishing.color}
          cellSize={cellSize}
        />
      )}
    </svg>
  );
};
