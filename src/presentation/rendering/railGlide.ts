import type { Point } from './boardLayout';

/**
 * railGlide — Interpolación del deslizamiento (glide) SOBRE EL RIEL de celdas.
 *
 * Problema que resuelve (Síntoma A: "se parte en los giros"): interpolar cada
 * vértice en línea recta `from[i] → to[i]` hace que, en una esquina, la recta
 * corte la diagonal y el cuerpo abandone el camino de celdas. Aquí, entre dos
 * proyecciones del dominio (un avance de UNA celda por tick), reconstruimos el
 * "riel" —la polilínea de centros de celda que une la forma vieja y la nueva—
 * y colocamos cada vértice por LONGITUD DE ARCO sobre él: cada vértice viaja
 * pegado al camino y las esquinas se doblan en vez de cortarse.
 *
 * No inventa posiciones: el riel se construye SOLO con celdas que el dominio ya
 * proyectó (from + la nueva celda líder de to). Si `to` no es `from` avanzado
 * un paso, `buildRail` devuelve null y el caller cae al glide lineal previo.
 */

/** Tolerancia para tratar dos centros de celda como el mismo punto. */
const COINCIDENT_EPS = 1e-6;

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function samePoint(a: Point, b: Point): boolean {
  return dist(a, b) <= COINCIDENT_EPS;
}

/**
 * Construye el riel que une la forma vieja (`from`) y la nueva (`to`).
 *
 * En un avance de un paso, `to[i] === from[i+1]` (la forma se corre una celda),
 * así que el riel ordenado cola→punta es:
 *   [ from[0], to[0], to[1], …, to[N-1] ]   (N+1 nodos)
 * es decir la celda vacada (from[0]) seguida de todas las celdas nuevas.
 *
 * Guard: si `from`/`to` no tienen la misma longitud (≥1) o `to` no es `from`
 * avanzado exactamente un paso, devuelve null → el caller usa el glide lineal.
 */
export function buildRail(from: Point[], to: Point[]): Point[] | null {
  const n = from.length;
  if (n < 1 || to.length !== n) {
    return null;
  }
  // `to` debe ser `from` corrido un paso: to[i] === from[i+1] para i < n-1.
  for (let i = 0; i < n - 1; i++) {
    if (!samePoint(to[i], from[i + 1])) {
      return null;
    }
  }
  const rail: Point[] = [from[0], ...to];
  // Nodos consecutivos coincidentes (p.ej. sin movimiento real) invalidan el
  // riel: no hay tramo que recorrer → fallback lineal.
  for (let i = 0; i < rail.length - 1; i++) {
    if (samePoint(rail[i], rail[i + 1])) {
      return null;
    }
  }
  return rail;
}

/** Arcos acumulados de los nodos del riel (longitud 0 en el nodo inicial). */
function cumulativeArcs(rail: Point[]): number[] {
  const arcs = [0];
  for (let i = 0; i < rail.length - 1; i++) {
    arcs.push(arcs[i] + dist(rail[i], rail[i + 1]));
  }
  return arcs;
}

/**
 * Punto sobre el riel a una longitud de arco dada (clampeada a [0, total]).
 * Recorre los tramos acumulando longitud hasta alojar `arc`.
 */
export function sampleRailAtArc(rail: Point[], arc: number): Point {
  const arcs = cumulativeArcs(rail);
  const total = arcs[arcs.length - 1];
  const target = Math.max(0, Math.min(arc, total));
  for (let i = 0; i < rail.length - 1; i++) {
    const segLen = arcs[i + 1] - arcs[i];
    if (segLen > 0 && target <= arcs[i + 1]) {
      const f = (target - arcs[i]) / segLen;
      return {
        x: rail[i].x + (rail[i + 1].x - rail[i].x) * f,
        y: rail[i].y + (rail[i + 1].y - rail[i].y) * f,
      };
    }
  }
  return { ...rail[rail.length - 1] };
}

/**
 * Dirección unitaria del TRAMO del riel que contiene la longitud de arco dada,
 * más su índice de tramo. Convención de frontera: en un nodo-esquina exacto se
 * devuelve el tramo SALIENTE (el vértice ya "dobló"). Esto hace que la cabeza
 * gire en el instante justo del doblez (ni antes ni después).
 */
export function railDirectionAtArc(
  rail: Point[],
  arc: number,
): { dir: { x: number; y: number }; segmentIndex: number } {
  // Riel degenerado (0/1 nodo): no hay tramo del que tomar dirección. Devuelve
  // una dirección nula sin lanzar; el caller decide el fallback (p.ej. exitDir).
  if (rail.length < 2) {
    return { dir: { x: 0, y: 0 }, segmentIndex: 0 };
  }
  const arcs = cumulativeArcs(rail);
  const total = arcs[arcs.length - 1];
  const target = Math.max(0, Math.min(arc, total));
  let seg = 0;
  // Primer tramo cuyo extremo final supera estrictamente el arco objetivo; en
  // la esquina exacta esto selecciona el tramo saliente (arco == arcs[i+1] pasa
  // al siguiente). El último tramo cubre el extremo total.
  for (let i = 0; i < rail.length - 1; i++) {
    seg = i;
    if (target < arcs[i + 1]) {
      break;
    }
  }
  const a = rail[seg];
  const b = rail[seg + 1];
  const len = dist(a, b) || 1;
  return { dir: { x: (b.x - a.x) / len, y: (b.y - a.y) / len }, segmentIndex: seg };
}

/** Longitud total de arco de un riel. */
function totalArc(rail: Point[]): number {
  let sum = 0;
  for (let i = 0; i < rail.length - 1; i++) {
    sum += dist(rail[i], rail[i + 1]);
  }
  return sum;
}

/** Resultado del glide sobre el riel para un instante t. */
export interface RailGlideResult {
  /**
   * Puntos del CUERPO a dibujar: extremos por arco + los nodos-esquina
   * interiores, de modo que la polilínea doble en cada esquina sin cortar.
   */
  body: Point[];
  /** Los N vértices lógicos colocados por arco (punta = último). */
  vertices: Point[];
  /** Dirección unitaria del tramo bajo el vértice líder (para la cabeza). */
  tipDir: { x: number; y: number };
  /** Índice del tramo del riel bajo el vértice líder. */
  tipSegmentIndex: number;
}

/**
 * Coloca una forma de `count` vértices sobre el riel a partir de un ESCALAR:
 * `arcOffset` (arco del vértice trasero). El vértice i vive en
 * `arcOffset + i·step`, muestreado sobre el riel → EXACTO sobre el camino. El
 * cuerpo se traza del trasero al líder incluyendo los nodos-esquina interiores,
 * de modo que dobla sin cortar. La punta se orienta según el TRAMO bajo el
 * vértice líder (gira justo en la esquina).
 *
 * Este es el núcleo del "riel persistente + offset continuo": la forma es una
 * ventana deslizante sobre el riel, parametrizada por un único offset que un
 * rAF persigue a velocidad constante. Un retarget en vuelo solo mueve el target
 * del offset; muestrear el mismo offset tras APPENDEAR nodos por delante no
 * altera la forma dibujada (continuidad C0).
 */
export function sampleShapeOnRail(
  rail: Point[],
  arcOffset: number,
  count: number,
  step: number,
): RailGlideResult {
  const vertexArc = (i: number): number => arcOffset + i * step;
  const vertices: Point[] = [];
  for (let i = 0; i < count; i++) {
    vertices.push(sampleRailAtArc(rail, vertexArc(i)));
  }

  // Arco de la ventana [trasero, líder] y nodos-esquina interiores a incluir.
  const arcs = cumulativeArcs(rail);
  const rearArc = vertexArc(0);
  const leadArc = vertexArc(count - 1);
  const interior: Point[] = [];
  for (let k = 0; k < rail.length; k++) {
    if (arcs[k] > rearArc + COINCIDENT_EPS && arcs[k] < leadArc - COINCIDENT_EPS) {
      interior.push(rail[k]);
    }
  }

  // Cuerpo: [líder trasero, nodos interiores, líder]. Pares colineales → sin cortes.
  const bodyRaw: Point[] =
    count <= 1 ? [vertices[0]] : [vertices[0], ...interior, vertices[count - 1]];
  const body: Point[] = [];
  for (const p of bodyRaw) {
    if (body.length === 0 || !samePoint(body[body.length - 1], p)) {
      body.push(p);
    }
  }

  const tip = railDirectionAtArc(rail, leadArc);
  return {
    body,
    vertices,
    tipDir: tip.dir,
    tipSegmentIndex: tip.segmentIndex,
  };
}

/**
 * Coloca la forma en el riel para el instante `t ∈ [0,1]` (avance de un paso).
 *
 * Azúcar sobre `sampleShapeOnRail`: construye el riel `from`→`to` y desliza la
 * ventana de `arcOffset = t·paso`. Devuelve null si el riel no aplica (→ el
 * caller usa el glide lineal previo).
 */
export function glideAlongRail(
  from: Point[],
  to: Point[],
  t: number,
): RailGlideResult | null {
  const rail = buildRail(from, to);
  if (rail === null) {
    return null;
  }
  const n = from.length; // nº de vértices; el riel tiene n+1 nodos.
  const step = totalArc(rail) / n; // paso uniforme (una celda) por vértice.
  return sampleShapeOnRail(rail, t * step, n, step);
}
