import { screenToCell, type Point, type BoardLayout } from '../rendering/boardLayout';
import type { PlayMoveCommand } from './PlayMoveCommand';

/** Resuelve qué flecha (si alguna) ocupa una celda de la rejilla. */
export type ArrowResolver = (col: number, row: number) => string | null;

/**
 * resolveTap — Núcleo PURO de la decisión de input (sin DOM ni React).
 *
 * Pipeline (B3):
 *   1. Invierte el punto de pantalla a (col,row) con la geometría de B1.
 *   2. Si cae fuera del tablero → null (no se emite nada).
 *   3. Consulta qué flecha ocupa esa celda. Celda vacía → null.
 *   4. Si hay flecha → emite un PlayMoveCommand con su id.
 *
 * No evalúa reglas de movimiento ni colisiones: solo traduce "toque" a
 * "intención de mover esta flecha". El motor decide el resultado del tick.
 *
 * @param point - Punto del toque en unidades del viewBox.
 * @param layout - Geometría resuelta del tablero (cellSize/offset/bounds).
 * @param resolveArrowIdAt - Consulta de ocupación celda → arrowId.
 * @returns El comando a emitir, o null si no procede.
 */
export function resolveTap(
  point: Point,
  layout: BoardLayout,
  resolveArrowIdAt: ArrowResolver,
): PlayMoveCommand | null {
  const cell = screenToCell(
    point,
    layout.cellSize,
    layout.offset,
    layout.maxCol,
    layout.maxRow,
  );
  if (cell === null) {
    return null;
  }

  const arrowId = resolveArrowIdAt(cell.col, cell.row);
  if (arrowId === null) {
    return null;
  }

  return { arrowId };
}

/** Datos de un pointer relevantes para el gating, independientes del DOM/React. */
export interface PointerGate {
  /** Botón del pointer (0 = primario). */
  button: number;
  /** Si es el pointer primario (descarta toques secundarios en multi-touch). */
  isPrimary: boolean;
}

/**
 * decideTap — Decisión COMPLETA y PURA de input (gating + resolución).
 *
 * Aplica, en orden, las reglas de B3 sin tocar el DOM:
 *   1. enabled=false → descarta (movimiento en vuelo o estado terminal).
 *   2. botón no primario → ignora (click derecho/medio).
 *   3. pointer secundario → ignora (multi-touch).
 *   4. resuelve punto → celda → flecha (resolveTap).
 *
 * @returns El comando a emitir, o null si el toque debe descartarse.
 */
export function decideTap(
  enabled: boolean,
  gate: PointerGate,
  point: Point,
  layout: BoardLayout,
  resolveArrowIdAt: ArrowResolver,
): PlayMoveCommand | null {
  if (!enabled) {
    return null;
  }
  if (gate.button !== 0) {
    return null;
  }
  if (!gate.isPrimary) {
    return null;
  }
  return resolveTap(point, layout, resolveArrowIdAt);
}
