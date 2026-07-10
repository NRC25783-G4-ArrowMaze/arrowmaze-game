import React, { useId, useLayoutEffect, useRef, useState } from 'react';
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
import { ArrowExit } from './ArrowExit';
import { BOARD_BACKGROUND, DOT_RADIUS_RATIO } from '../theme';
import type { BoardViewModel } from '../viewModel';

/** Forma de una flecha registrada para detectar su salida (shrink del riel). */
interface ArrowShapeSnap {
  cellIds: string[];
  exitDir: number;
  color: string;
}

/** Overlay de salida voladora en curso. */
interface ExitOverlay {
  key: number;
  arrowId: string;
  centers: Point[];
  exitDir: number;
  color: string;
  cellSize: number;
}

/**
 * ¿`curr` es `prev` tras salir la celda LÍDER (shrink de salida)? El dominio
 * acorta la flecha por el frente al salir: curr.length === prev.length−1 y
 * curr[i] === prev[i+1]. Distingue la salida de un restart (patrón que no casa).
 */
function isExitShrink(prevIds: string[], currIds: string[]): boolean {
  if (currIds.length !== prevIds.length - 1) {
    return false;
  }
  return currIds.every((id, i) => id === prevIds[i + 1]);
}

/**
 * ¿La celda-cabeza (`cellIds` termina en la punta) estaba en el borde apuntando
 * FUERA del tablero? Es decir, ¿dar un paso en `exitDir` desde la cabeza cae
 * fuera del bounding box? Sólo entonces una desaparición "sin shrink" es una
 * salida real; una remoción a media pista (restart/clear) no lo cumple.
 */
function wasLeavingBoard(
  headId: string,
  exitDir: number,
  cellPos: Map<string, { col: number; row: number }>,
  maxCol: number,
  maxRow: number,
): boolean {
  const head = cellPos.get(headId);
  if (head === undefined) {
    return false;
  }
  const { dCol, dRow } = portDelta(exitDir);
  const col = head.col + dCol;
  const row = head.row + dRow;
  return col < 0 || col > maxCol || row < 0 || row > maxRow;
}

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
  /**
   * Celda que el tutorial guiado está señalando: dibuja una manito con sombra y
   * un anillo pulsante sobre su centro. Ausente → sin guía.
   */
  hintCell?: { col: number; row: number };
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
  hintCell,
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

  // ── Salida voladora (overlays fuera de la flecha viva) ───────────────────
  // Detecta el shrink de salida comparando la proyección de cada flecha con la
  // del tick anterior; al detectarlo, congela la forma COMPLETA y lanza un
  // overlay ArrowExit que la desliza fuera del tablero y la funde. La flecha
  // viva se oculta mientras su overlay vive (evita visión doble).
  const [exits, setExits] = useState<ExitOverlay[]>([]);
  // Id único del clipPath de salida: evita colisiones si hay >1 BoardComponent.
  const exitClipId = `board-exit-clip-${useId()}`;
  const prevArrowsRef = useRef<Map<string, ArrowShapeSnap>>(new Map());
  const exitingIdsRef = useRef<Set<string>>(new Set());
  const nonceRef = useRef(0);

  const arrowsSig = arrows
    .map((a) => `${a.id}:${a.cellIds.join(',')}`)
    .join('|');

  useLayoutEffect(() => {
    const layout = computeBoardLayout(cells, width, height);
    const cById = new Map<string, Point>(
      cells.map((c) => [c.id, cellCenter(c.col, c.row, layout.cellSize, layout.offset)]),
    );
    // Posiciones de grilla (col,row) para decidir si una cabeza estaba saliendo.
    const cellPos = new Map<string, { col: number; row: number }>(
      cells.map((c) => [c.id, { col: c.col, row: c.row }]),
    );
    const currMap = new Map<string, ArrowShapeSnap>(
      arrows.map((a) => [
        a.id,
        { cellIds: [...a.cellIds], exitDir: a.exitDir, color: a.color },
      ]),
    );

    const spawn = (id: string, snap: ArrowShapeSnap): void => {
      if (exitingIdsRef.current.has(id)) {
        return;
      }
      const centers = snap.cellIds
        .map((cid) => cById.get(cid))
        .filter((p): p is Point => p !== undefined);
      if (centers.length !== snap.cellIds.length || centers.length === 0) {
        return; // no se pudo resolver la forma: se omite (nunca a la fuerza).
      }
      nonceRef.current += 1;
      const key = nonceRef.current;
      exitingIdsRef.current.add(id);
      setExits((prev) => [
        ...prev,
        { key, arrowId: id, centers, exitDir: snap.exitDir, color: snap.color, cellSize: layout.cellSize },
      ]);
    };

    for (const [id, prevSnap] of prevArrowsRef.current) {
      if (exitingIdsRef.current.has(id)) {
        continue; // ya volando en un overlay.
      }
      const curr = currMap.get(id);
      if (curr === undefined) {
        // Desapareció sin shrink previo. Sólo es una salida REAL si era de 1 celda
        // (las de ≥2 celdas siempre muestran shrink antes → ya se lanzaron y se
        // deduplican) y esa celda estaba en el borde apuntando fuera. Así un
        // restart/clear a media pista no dispara salidas voladoras fantasma.
        const head = prevSnap.cellIds[prevSnap.cellIds.length - 1];
        if (
          prevSnap.cellIds.length === 1 &&
          wasLeavingBoard(head, prevSnap.exitDir, cellPos, layout.maxCol, layout.maxRow)
        ) {
          spawn(id, prevSnap);
        }
      } else if (isExitShrink(prevSnap.cellIds, curr.cellIds)) {
        spawn(id, prevSnap);
      }
    }
    prevArrowsRef.current = currMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrowsSig]);

  const removeExit = (key: string, arrowId: string): void => {
    exitingIdsRef.current.delete(arrowId);
    setExits((prev) => prev.filter((e) => String(e.key) !== key));
  };

  // Ids con overlay activo → se ocultan de la capa de flechas vivas.
  const exitingIds = new Set(exits.map((e) => e.arrowId));
  // Exit-mode activo → se gatea (omite) el burst/disintegrate: la salida
  // voladora + fade reemplaza al "pop" en el borde.
  const exitActive = exits.length > 0;

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

      {/* Pasada 2: cada flecha encima de los puntos. Las que están saliendo se
          ocultan aquí: su overlay ArrowExit es el único visual (sin visión doble). */}
      <g data-testid="pass-arrows">
        {arrows.map((arrow) => {
          if (exitingIds.has(arrow.id)) {
            return null;
          }
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

      {/* Tutorial guiado: manito con sombra + anillo pulsante sobre la celda a
          tocar. pointerEvents=none para no robar el toque real al tablero. */}
      {hintCell !== undefined && cellSize > 0 && (() => {
        const c = cellCenter(hintCell.col, hintCell.row, cellSize, offset);
        const ringRadius = cellSize * 0.42;
        return (
          <g data-testid="tutorial-hint" style={{ pointerEvents: 'none' }}>
            <circle
              className="tutorial-hint-ring"
              cx={c.x}
              cy={c.y}
              r={ringRadius}
              fill="none"
              stroke="#111827"
              strokeWidth={cellSize * 0.06}
            />
            <text
              className="tutorial-hint-hand"
              x={c.x}
              y={c.y + cellSize * 0.72}
              textAnchor="middle"
              fontSize={cellSize * 0.85}
            >
              👆
            </text>
          </g>
        );
      })()}

      {/* Salida voladora: overlays recortados al rect del tablero (la flecha se
          sale del MUNDO y el borde se la va tragando mientras se funde). */}
      {exits.length > 0 && cellSize > 0 && (
        <>
          <clipPath id={exitClipId}>
            <rect
              x={offset.x - cellSize / 2}
              y={offset.y - cellSize / 2}
              width={(maxCol + 1) * cellSize}
              height={(maxRow + 1) * cellSize}
            />
          </clipPath>
          <g data-testid="pass-exits" clipPath={`url(#${exitClipId})`}>
            {exits.map((e) => (
              <ArrowExit
                key={e.key}
                centers={e.centers}
                exitDir={e.exitDir}
                color={e.color}
                cellSize={e.cellSize}
                onDone={() => removeExit(String(e.key), e.arrowId)}
              />
            ))}
          </g>
        </>
      )}

      {/* Desintegración de la punta: fractura que precede al estallido. Gateada
          en exit-mode: la salida voladora + fade reemplaza el "pop" en el borde.
          (Componente intacto; solo se omite su disparo mientras hay overlays.) */}
      {!exitActive &&
        headDisintegrating !== undefined &&
        headDisintegrateOrigin !== undefined && (
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

      {/* Estallido de desaparición: chispas en la cabeza. Gateado igual que arriba. */}
      {!exitActive && vanishing !== undefined && burstOrigin !== undefined && (
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
