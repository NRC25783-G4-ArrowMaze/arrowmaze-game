import {
  buildRail,
  sampleRailAtArc,
  railDirectionAtArc,
  glideAlongRail,
  sampleShapeOnRail,
  extendRailForExit,
} from '../../src/presentation/rendering/railGlide';
import { exitOpacity, EXIT_FADE_START } from '../../src/presentation/rendering/glideConfig';
import type { Point } from '../../src/presentation/rendering/boardLayout';

// ── Utilidades de test (geometría, sin DOM) ──────────────────────────────────

const EPS = 1e-9;

function close(a: number, b: number, eps = EPS): boolean {
  return Math.abs(a - b) <= eps;
}

function pointClose(p: Point, q: Point, eps = EPS): boolean {
  return close(p.x, q.x, eps) && close(p.y, q.y, eps);
}

/** Distancia de un punto al segmento [a,b] (proyección clampeada al segmento). */
function distPointSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}

/** Mínima distancia de un punto a CUALQUIER segmento del riel. */
function distToRail(p: Point, rail: Point[]): number {
  let min = Infinity;
  for (let i = 0; i < rail.length - 1; i++) {
    min = Math.min(min, distPointSegment(p, rail[i], rail[i + 1]));
  }
  return min;
}

// Formas de referencia (centros de celda; cellSize = 10).
// Flecha horizontal de 3 celdas que dobla hacia abajo (giro en L de 90°).
const L_FROM: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 20, y: 0 },
];
const L_TO: Point[] = [
  { x: 10, y: 0 },
  { x: 20, y: 0 },
  { x: 20, y: 10 },
];
// Riel resultante: (0,0)→(10,0)→(20,0)→(20,10), esquina en (20,0).

// Flecha recta de 3 celdas que avanza un paso sin doblar.
const STRAIGHT_FROM: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 20, y: 0 },
];
const STRAIGHT_TO: Point[] = [
  { x: 10, y: 0 },
  { x: 20, y: 0 },
  { x: 30, y: 0 },
];

// ── buildRail ────────────────────────────────────────────────────────────────

describe('buildRail', () => {
  it('une forma vieja y nueva en la polilínea de nodos del riel (N+1 nodos)', () => {
    const rail = buildRail(L_FROM, L_TO);
    expect(rail).not.toBeNull();
    expect(rail).toHaveLength(4);
    const expected: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ];
    rail!.forEach((p, i) => expect(pointClose(p, expected[i])).toBe(true));
  });

  it('devuelve null (→ fallback lineal) si `to` no es `from` avanzado un paso', () => {
    const from: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const to: Point[] = [
      { x: 50, y: 0 },
      { x: 60, y: 0 },
    ];
    expect(buildRail(from, to)).toBeNull();
  });

  it('devuelve null si las longitudes difieren', () => {
    expect(buildRail(L_FROM, L_TO.slice(0, 2))).toBeNull();
  });

  it('soporta una flecha de una sola celda (riel de 2 nodos)', () => {
    const rail = buildRail([{ x: 0, y: 0 }], [{ x: 10, y: 0 }]);
    expect(rail).not.toBeNull();
    expect(rail).toHaveLength(2);
  });
});

// ── sampleRailAtArc ──────────────────────────────────────────────────────────

describe('sampleRailAtArc', () => {
  const rail: Point[] = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];

  it('arco 0 → nodo inicial; arco total → nodo final', () => {
    expect(pointClose(sampleRailAtArc(rail, 0), { x: 0, y: 0 })).toBe(true);
    expect(pointClose(sampleRailAtArc(rail, 20), { x: 10, y: 10 })).toBe(true);
  });

  it('a mitad de un tramo → punto medio del tramo', () => {
    expect(pointClose(sampleRailAtArc(rail, 5), { x: 5, y: 0 })).toBe(true);
    expect(pointClose(sampleRailAtArc(rail, 15), { x: 10, y: 5 })).toBe(true);
  });

  it('clampa fuera de rango [0, total]', () => {
    expect(pointClose(sampleRailAtArc(rail, -3), { x: 0, y: 0 })).toBe(true);
    expect(pointClose(sampleRailAtArc(rail, 100), { x: 10, y: 10 })).toBe(true);
  });
});

// ── railDirectionAtArc (dirección de la cabeza que gira en la esquina) ────────

describe('railDirectionAtArc', () => {
  // Riel en L: tramo 0 = este (1,0), tramo 1 = sur (0,1). Esquina en arco 20.
  const rail: Point[] = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 20 },
  ];

  it('ANTES de la esquina → dirección del tramo 1 (este)', () => {
    const r = railDirectionAtArc(rail, 10);
    expect(r.segmentIndex).toBe(0);
    expect(pointClose(r.dir, { x: 1, y: 0 })).toBe(true);
  });

  it('TRAS cruzar la esquina → dirección del tramo 2 (sur)', () => {
    const r = railDirectionAtArc(rail, 30);
    expect(r.segmentIndex).toBe(1);
    expect(pointClose(r.dir, { x: 0, y: 1 })).toBe(true);
  });

  it('riel degenerado (un solo nodo) → dirección nula, SIN lanzar', () => {
    expect(() => railDirectionAtArc([{ x: 5, y: 5 }], 0)).not.toThrow();
    const r = railDirectionAtArc([{ x: 5, y: 5 }], 0);
    expect(pointClose(r.dir, { x: 0, y: 0 })).toBe(true);
  });
});

// ── glideAlongRail ───────────────────────────────────────────────────────────

describe('glideAlongRail', () => {
  const TS = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

  it('⭐ INVARIANTE: para todo t, todo vértice y todo punto del cuerpo vive en el riel (L)', () => {
    const rail = buildRail(L_FROM, L_TO)!;
    for (const t of TS) {
      const g = glideAlongRail(L_FROM, L_TO, t)!;
      for (const v of g.vertices) {
        expect(distToRail(v, rail)).toBeLessThan(1e-9);
      }
      for (const p of g.body) {
        expect(distToRail(p, rail)).toBeLessThan(1e-9);
      }
    }
  });

  it('en un riel recto coincide con la interpolación lineal por vértice', () => {
    for (const t of TS) {
      const g = glideAlongRail(STRAIGHT_FROM, STRAIGHT_TO, t)!;
      STRAIGHT_FROM.forEach((f, i) => {
        const lin: Point = {
          x: f.x + (STRAIGHT_TO[i].x - f.x) * t,
          y: f.y + (STRAIGHT_TO[i].y - f.y) * t,
        };
        expect(pointClose(g.vertices[i], lin, 1e-9)).toBe(true);
      });
    }
  });

  it('en el giro, el cuerpo incluye el nodo-esquina (dobla, no corta la diagonal)', () => {
    const g = glideAlongRail(L_FROM, L_TO, 0.5)!;
    const corner: Point = { x: 20, y: 0 };
    const hasCorner = g.body.some((p) => pointClose(p, corner));
    expect(hasCorner).toBe(true);
  });

  it('extremos exactos: t=0 ⇒ body == from; t=1 ⇒ body == to', () => {
    const g0 = glideAlongRail(L_FROM, L_TO, 0)!;
    expect(g0.body).toHaveLength(L_FROM.length);
    L_FROM.forEach((f, i) => expect(pointClose(g0.body[i], f)).toBe(true));

    const g1 = glideAlongRail(L_FROM, L_TO, 1)!;
    expect(g1.body).toHaveLength(L_TO.length);
    L_TO.forEach((t2, i) => expect(pointClose(g1.body[i], t2)).toBe(true));
  });

  it('coloca los vértices por arco creciente (orden preservado)', () => {
    const g = glideAlongRail(L_FROM, L_TO, 0.5)!;
    expect(g.vertices).toHaveLength(L_FROM.length);
    // Arcos acumulados del vértice i deben ser estrictamente crecientes.
    const arcs = g.vertices.map((v) => v.x + v.y); // proxy monótono sobre este riel
    for (let i = 1; i < arcs.length; i++) {
      expect(arcs[i]).toBeGreaterThan(arcs[i - 1]);
    }
  });

  it('la punta apunta según su TRAMO de viaje: en el tick que dobla, mira al sur (no al este)', () => {
    // La celda líder viaja (20,0)→(20,10) = sur. La cabeza NO debe seguir mirando al este.
    for (const t of [0.1, 0.5, 0.9]) {
      const g = glideAlongRail(L_FROM, L_TO, t)!;
      expect(pointClose(g.tipDir, { x: 0, y: 1 })).toBe(true);
    }
  });

  it('devuelve null cuando buildRail no aplica (→ el caller usa el glide lineal)', () => {
    const from: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const to: Point[] = [
      { x: 50, y: 0 },
      { x: 60, y: 0 },
    ];
    expect(glideAlongRail(from, to, 0.5)).toBeNull();
  });
});

// ── sampleShapeOnRail (riel persistente + offset continuo) ────────────────────

describe('sampleShapeOnRail', () => {
  const STEP = 10;

  // Riel largo con 3 giros (zig-zag): E, S, E, S.
  const LONG_RAIL: Point[] = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 }, // esquina → sur
    { x: 20, y: 10 },
    { x: 20, y: 20 }, // esquina → este
    { x: 30, y: 20 },
    { x: 40, y: 20 }, // esquina → sur
    { x: 40, y: 30 },
  ];

  it('coloca N vértices a paso constante desde arcOffset (arcos crecientes)', () => {
    const g = sampleShapeOnRail(LONG_RAIL, 5, 3, STEP);
    expect(g.vertices).toHaveLength(3);
    // El vértice i vive en arcOffset + i·STEP; arcos crecientes.
    const arcish = g.vertices.map((v) => v.x + v.y);
    for (let i = 1; i < arcish.length; i++) {
      expect(arcish[i]).toBeGreaterThan(arcish[i - 1]);
    }
  });

  it('⭐ INVARIANTE en riel largo con 3+ giros: barrido denso de arcOffset', () => {
    const count = 3;
    const maxOffset = STEP * (LONG_RAIL.length - 1 - (count - 1));
    for (let off = 0; off <= maxOffset; off += 1) {
      const g = sampleShapeOnRail(LONG_RAIL, off, count, STEP);
      for (const v of g.vertices) {
        expect(distToRail(v, LONG_RAIL)).toBeLessThan(1e-9);
      }
      for (const p of g.body) {
        expect(distToRail(p, LONG_RAIL)).toBeLessThan(1e-9);
      }
    }
  });

  it('CONTINUIDAD C0 en retarget: extender el riel NO mueve la posición dibujada actual', () => {
    const count = 3;
    const offset = 15; // a mitad de arco (dentro de un tramo)
    const before = sampleShapeOnRail(LONG_RAIL, offset, count, STEP);
    // Simula el retarget en vuelo: se APPENDEA una celda líder nueva al riel.
    const extended: Point[] = [...LONG_RAIL, { x: 40, y: 40 }];
    const after = sampleShapeOnRail(extended, offset, count, STEP);
    // Mismo offset ⇒ misma forma dibujada (append por delante no perturba el pasado).
    before.vertices.forEach((v, i) => expect(pointClose(v, after.vertices[i])).toBe(true));
    expect(before.body).toHaveLength(after.body.length);
    before.body.forEach((p, i) => expect(pointClose(p, after.body[i])).toBe(true));
    // Y el invariante se mantiene sobre el riel extendido en todo el barrido.
    const maxOffset = STEP * (extended.length - 1 - (count - 1));
    for (let off = 0; off <= maxOffset; off += 2) {
      const g = sampleShapeOnRail(extended, off, count, STEP);
      for (const p of g.body) expect(distToRail(p, extended)).toBeLessThan(1e-9);
    }
  });

  it('VELOCIDAD CONSTANTE: offsets equiespaciados ⇒ posiciones equiespaciadas en arco', () => {
    const straight: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 30, y: 0 },
    ];
    // En recto, arco == distancia euclídea: pasos de offset iguales ⇒ saltos iguales.
    const p0 = sampleShapeOnRail(straight, 0, 2, STEP).vertices[1];
    const p1 = sampleShapeOnRail(straight, 3, 2, STEP).vertices[1];
    const p2 = sampleShapeOnRail(straight, 6, 2, STEP).vertices[1];
    const d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    expect(close(d1, d2, 1e-9)).toBe(true);
    expect(close(d1, 3, 1e-9)).toBe(true);
  });

  it('la punta se orienta según el TRAMO del vértice líder (gira en la esquina)', () => {
    // count=2, STEP=10. Vértice líder en arcOffset + 10.
    // Con arcOffset=5 → líder en arco 15 → tramo sur (0,1) de LONG_RAIL (esquina en 20... )
    // Ajustamos a un riel en L simple para claridad:
    const lRail: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    // Líder (arcOffset+10). arcOffset=0 → líder en arco 10 (esquina) → tramo saliente sur.
    const g = sampleShapeOnRail(lRail, 0, 2, STEP);
    expect(pointClose(g.tipDir, { x: 0, y: 1 })).toBe(true);
  });
});

// ── extendRailForExit + salida voladora ──────────────────────────────────────

describe('extendRailForExit', () => {
  const CELL = 10;

  it('añade nodos virtuales en la dirección del último tramo (flecha recta al Este)', () => {
    const centers: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ];
    const rail = extendRailForExit(centers, 1, 2, CELL);
    // Conserva los nodos reales al inicio.
    centers.forEach((c, i) => expect(pointClose(rail[i], c)).toBe(true));
    // Los nodos virtuales continúan al Este (x creciente, y constante).
    for (let i = centers.length; i < rail.length; i++) {
      expect(rail[i].y).toBe(0);
      expect(rail[i].x).toBeGreaterThan(rail[i - 1].x);
    }
    // Longitud suficiente para el vuelo (largo + margen + holgura).
    expect(rail.length).toBeGreaterThan(centers.length + 2);
  });

  it('flecha de UNA celda usa portDelta(exitDir) para la dirección (Sur)', () => {
    const rail = extendRailForExit([{ x: 5, y: 5 }], 2 /* Sur */, 2, CELL);
    expect(rail.length).toBeGreaterThan(1);
    // Sur → y creciente, x constante.
    for (let i = 1; i < rail.length; i++) {
      expect(rail[i].x).toBe(5);
      expect(rail[i].y).toBeGreaterThan(rail[i - 1].y);
    }
  });

  it('venir de un codo: el vuelo continúa en la dirección del último tramo (Sur)', () => {
    const centers: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 }, // dobló al Sur justo antes de salir
    ];
    const rail = extendRailForExit(centers, 2, 1, CELL);
    for (let i = centers.length; i < rail.length; i++) {
      expect(rail[i].x).toBe(10);
      expect(rail[i].y).toBeGreaterThan(rail[i - 1].y);
    }
  });

  it('⭐ INVARIANTE: la forma completa vive en el riel extendido durante todo el vuelo', () => {
    const centers: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ];
    const rail = extendRailForExit(centers, 1, 2, CELL);
    const count = centers.length;
    const flyTarget = (count + 2) * CELL; // largo + margen
    for (let off = 0; off <= flyTarget; off += 1) {
      const g = sampleShapeOnRail(rail, off, count, CELL);
      for (const p of g.body) expect(distToRail(p, rail)).toBeLessThan(1e-9);
      for (const v of g.vertices) expect(distToRail(v, rail)).toBeLessThan(1e-9);
    }
  });

  it('centros vacíos → riel vacío (sin lanzar)', () => {
    expect(extendRailForExit([], 1, 2, CELL)).toEqual([]);
  });
});

describe('exitOpacity (fade de salida)', () => {
  it('opacidad plena hasta EXIT_FADE_START y monótona no creciente', () => {
    expect(exitOpacity(0)).toBe(1);
    expect(exitOpacity(EXIT_FADE_START)).toBe(1);
    let prev = 1;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const o = exitOpacity(p);
      expect(o).toBeLessThanOrEqual(prev + 1e-9);
      expect(o).toBeGreaterThanOrEqual(0);
      prev = o;
    }
  });

  it('el fade llega a 0 al final del vuelo (p = 1)', () => {
    expect(exitOpacity(1)).toBeCloseTo(0, 10);
    expect(exitOpacity(1.5)).toBe(0); // clamp por encima de 1
  });
});
