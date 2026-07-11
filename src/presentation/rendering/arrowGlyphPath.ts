import { portDelta, type Point } from './boardLayout';
import { ARROW_GLYPH } from '../theme';

/**
 * arrowGlyphPath — Primitivas PURAS de dibujo del glifo de la flecha (cuerpo +
 * cabeza), compartidas por ArrowComponent (flecha viva) y ArrowExit (salida
 * voladora). Centralizarlas garantiza que ambos dibujen exactamente igual.
 *
 * Geometría de la cabeza en fracciones de cellSize, ya escalada por ARROW_SCALE
 * (ARROW_GLYPH): punto único de verdad del tamaño.
 */
const HEAD_TIP_RATIO = ARROW_GLYPH.headTipRatio; // distancia del centro al apex
const HEAD_BACK_RATIO = ARROW_GLYPH.headBackRatio; // distancia del centro a la base
const HEAD_HALF_BASE_RATIO = ARROW_GLYPH.headHalfBaseRatio; // mitad del ancho de la base

/**
 * Construye el atributo `d` del cuerpo uniendo centros en orden con segmentos
 * rectos. Caso de una sola celda: `M x,y L x,y` (longitud cero) para que
 * `stroke-linecap: round` produzca un punto/cap redondo visible (spec B1).
 */
export function buildBodyPath(centers: Point[]): string {
  if (centers.length === 0) {
    return '';
  }
  const [first, ...rest] = centers;
  if (rest.length === 0) {
    return `M ${first.x},${first.y} L ${first.x},${first.y}`;
  }
  const move = `M ${first.x},${first.y}`;
  const lines = rest.map((p) => `L ${p.x},${p.y}`).join(' ');
  return `${move} ${lines}`;
}

/**
 * Dirección unitaria (en pantalla) hacia la que apunta la punta. Se toma del
 * último tramo del shaft (penúltima → última celda); para una flecha de una
 * sola celda se usa portDelta(exitDir).
 */
export function tipDirection(
  centers: Point[],
  exitDir: number,
): { x: number; y: number } {
  if (centers.length >= 2) {
    const prev = centers[centers.length - 2];
    const last = centers[centers.length - 1];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }
  const { dCol, dRow } = portDelta(exitDir);
  return { x: dCol, y: dRow };
}

/**
 * Puntos del polígono triangular de la punta, centrado en `center` y orientado
 * según el vector unitario `dir`. `compressionRatio` (1 = sin comprimir) permite
 * al caller aplicar deformación por impacto reduciendo el triángulo.
 */
export function buildHeadPoints(
  center: Point,
  dir: { x: number; y: number },
  cellSize: number,
  compressionRatio: number = 1,
): string {
  const dirX = dir.x;
  const dirY = dir.y;
  const perpX = -dirY;
  const perpY = dirX;

  const tip = HEAD_TIP_RATIO * cellSize * compressionRatio;
  const back = HEAD_BACK_RATIO * cellSize * compressionRatio;
  const half = HEAD_HALF_BASE_RATIO * cellSize * compressionRatio;

  const apex: Point = { x: center.x + dirX * tip, y: center.y + dirY * tip };
  const baseMid: Point = { x: center.x - dirX * back, y: center.y - dirY * back };
  const left: Point = { x: baseMid.x + perpX * half, y: baseMid.y + perpY * half };
  const right: Point = { x: baseMid.x - perpX * half, y: baseMid.y - perpY * half };

  return `${apex.x},${apex.y} ${left.x},${left.y} ${right.x},${right.y}`;
}
