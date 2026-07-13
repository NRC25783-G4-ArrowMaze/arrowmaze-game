import { Vector3 } from 'three';
import { portDelta3D } from './boardLayout';

/** Tolerancia para tratar dos centros de celda como el mismo punto. */
const COINCIDENT_EPS = 1e-6;

export function samePoint3D(a: Vector3, b: Vector3): boolean {
  return a.distanceTo(b) <= COINCIDENT_EPS;
}

/**
 * Construye el riel que une la forma vieja (`from`) y la nueva (`to`).
 */
export function buildRail3D(from: Vector3[], to: Vector3[]): Vector3[] | null {
  const n = from.length;
  if (n < 1 || to.length !== n) {
    return null;
  }
  for (let i = 0; i < n - 1; i++) {
    if (!samePoint3D(to[i], from[i + 1])) {
      return null;
    }
  }
  const rail: Vector3[] = [from[0], ...to];
  for (let i = 0; i < rail.length - 1; i++) {
    if (samePoint3D(rail[i], rail[i + 1])) {
      return null;
    }
  }
  return rail;
}

/** Arcos acumulados de los nodos del riel. */
export function cumulativeArcs3D(rail: Vector3[]): number[] {
  const arcs = [0];
  for (let i = 0; i < rail.length - 1; i++) {
    arcs.push(arcs[i] + rail[i].distanceTo(rail[i + 1]));
  }
  return arcs;
}

/**
 * Punto sobre el riel a una longitud de arco dada.
 */
export function sampleRailAtArc3D(rail: Vector3[], arc: number, precomputedArcs?: number[]): Vector3 {
  const arcs = precomputedArcs ?? cumulativeArcs3D(rail);
  const total = arcs[arcs.length - 1];
  const target = Math.max(0, Math.min(arc, total));
  for (let i = 0; i < rail.length - 1; i++) {
    const segLen = arcs[i + 1] - arcs[i];
    if (segLen > 0 && target <= arcs[i + 1]) {
      const f = (target - arcs[i]) / segLen;
      const pt = new Vector3().copy(rail[i]).lerp(rail[i + 1], f);
      return pt;
    }
  }
  return new Vector3().copy(rail[rail.length - 1]);
}

/**
 * Dirección unitaria del TRAMO del riel que contiene la longitud de arco dada.
 */
export function railDirectionAtArc3D(
  rail: Vector3[],
  arc: number,
  precomputedArcs?: number[],
): { dir: Vector3; segmentIndex: number } {
  if (rail.length < 2) {
    return { dir: new Vector3(0, 0, 0), segmentIndex: 0 };
  }
  const arcs = precomputedArcs ?? cumulativeArcs3D(rail);
  const total = arcs[arcs.length - 1];
  const target = Math.max(0, Math.min(arc, total));
  let seg = 0;
  for (let i = 0; i < rail.length - 1; i++) {
    seg = i;
    if (target < arcs[i + 1]) {
      break;
    }
  }
  const a = rail[seg];
  const b = rail[seg + 1];
  const dir = new Vector3().subVectors(b, a).normalize();
  return { dir, segmentIndex: seg };
}

/**
 * Extiende un riel con nodos VIRTUALES fuera del tablero para la salida voladora.
 */
export function extendRailForExit3D(
  centers: Vector3[],
  exitDir: number,
  marginCells: number,
  cellSize: number,
): Vector3[] {
  if (centers.length === 0) {
    return [];
  }
  const last = centers[centers.length - 1];
  let dir = new Vector3();
  if (centers.length >= 2) {
    const prev = centers[centers.length - 2];
    dir.subVectors(last, prev).normalize();
  } else {
    const { dCol, dRow, dLayer } = portDelta3D(exitDir);
    dir.set(dCol, dRow, dLayer).normalize();
  }
  const rail = centers.map((p) => p.clone());
  const virtualNodes = centers.length * 2 + Math.ceil(Math.max(0, marginCells)) + 2;
  for (let k = 1; k <= virtualNodes; k++) {
    const nextNode = new Vector3().copy(last).addScaledVector(dir, cellSize * k);
    rail.push(nextNode);
  }
  return rail;
}

export function totalArc3D(rail: Vector3[]): number {
  let sum = 0;
  for (let i = 0; i < rail.length - 1; i++) {
    sum += rail[i].distanceTo(rail[i + 1]);
  }
  return sum;
}

export interface RailGlideResult3D {
  body: Vector3[];
  vertices: Vector3[];
  tipDir: Vector3;
  tipSegmentIndex: number;
}

export function sampleShapeOnRail3D(
  rail: Vector3[],
  arcOffset: number,
  count: number,
  step: number,
): RailGlideResult3D {
  const arcs = cumulativeArcs3D(rail);
  const vertexArc = (i: number): number => arcOffset + i * step;
  const vertices: Vector3[] = [];
  for (let i = 0; i < count; i++) {
    vertices.push(sampleRailAtArc3D(rail, vertexArc(i), arcs));
  }

  const rearArc = vertexArc(0);
  const leadArc = vertexArc(count - 1);
  const interior: Vector3[] = [];
  for (let k = 0; k < rail.length; k++) {
    if (arcs[k] > rearArc + COINCIDENT_EPS && arcs[k] < leadArc - COINCIDENT_EPS) {
      interior.push(rail[k].clone());
    }
  }

  const bodyRaw: Vector3[] =
    count <= 1 ? [vertices[0]] : [vertices[0], ...interior, vertices[count - 1]];
  const body: Vector3[] = [];
  for (const p of bodyRaw) {
    if (body.length === 0 || !samePoint3D(body[body.length - 1], p)) {
      body.push(p);
    }
  }

  const tip = railDirectionAtArc3D(rail, leadArc, arcs);
  return {
    body,
    vertices,
    tipDir: tip.dir,
    tipSegmentIndex: tip.segmentIndex,
  };
}

export function glideAlongRail3D(
  from: Vector3[],
  to: Vector3[],
  t: number,
): RailGlideResult3D | null {
  const rail = buildRail3D(from, to);
  if (rail === null) {
    return null;
  }
  const n = from.length;
  const step = totalArc3D(rail) / n;
  return sampleShapeOnRail3D(rail, t * step, n, step);
}
