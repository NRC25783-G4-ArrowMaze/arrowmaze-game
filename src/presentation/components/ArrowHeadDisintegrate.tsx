import React, { useLayoutEffect, useState } from 'react';
import type { Point } from '../rendering/boardLayout';

/** Duración de la desintegración de la punta (ms). Aparece antes del burst. */
const DISINTEGRATE_MS = 150;

/** Deriva máxima de cada fragmento, como fracción de cellSize. */
const DRIFT_RATIO = 0.28;
/** Rotación máxima de cada fragmento (grados) al final de la deriva. */
const MAX_SPIN_DEG = 24;

/** Props: posición y escala de la punta que se desintegra. */
export interface ArrowHeadDisintegrateProps {
  /** Centro del triángulo (última posición de la cabeza). */
  center: Point;
  /** Color CSS (el de la flecha que se va). */
  color: string;
  /** Tamaño de celda para escalar el triángulo. */
  cellSize: number;
  /** Dirección unitaria del apex (hacia dónde apunta). */
  tipDir: { x: number; y: number };
}

/** Un fragmento de la fractura: sub-triángulo + su deriva y giro propios. */
interface Fragment {
  points: [Point, Point, Point];
  /** Dirección unitaria de deriva (desde el baricentro del triángulo hacia afuera). */
  driftDir: { x: number; y: number };
  /** Baricentro del fragmento (centro de rotación). */
  centroid: Point;
  /** Sentido y magnitud relativa del giro (-1 a 1). */
  spin: number;
}

function centroidOf(a: Point, b: Point, c: Point): Point {
  return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
}

/**
 * Parte el triángulo de la punta en 3 fragmentos (cada lado + el baricentro),
 * cada uno con una deriva radial hacia afuera y un giro alternado. La partición
 * es determinista: misma punta → misma fractura.
 */
function buildFragments(
  center: Point,
  tipDir: { x: number; y: number },
  cellSize: number,
): Fragment[] {
  // Parámetros del triángulo (espejo de ArrowComponent.buildHeadPoints).
  const HEAD_TIP_RATIO = 0.5;
  const HEAD_BACK_RATIO = 0.32;
  const HEAD_HALF_BASE_RATIO = 0.36;

  const dirX = tipDir.x;
  const dirY = tipDir.y;
  const perpX = -dirY;
  const perpY = dirX;

  const tip = HEAD_TIP_RATIO * cellSize;
  const back = HEAD_BACK_RATIO * cellSize;
  const half = HEAD_HALF_BASE_RATIO * cellSize;

  const apex: Point = { x: center.x + dirX * tip, y: center.y + dirY * tip };
  const baseMid: Point = { x: center.x - dirX * back, y: center.y - dirY * back };
  const left: Point = { x: baseMid.x + perpX * half, y: baseMid.y + perpY * half };
  const right: Point = { x: baseMid.x - perpX * half, y: baseMid.y - perpY * half };

  const g = centroidOf(apex, left, right);

  const sides: Array<[Point, Point, number]> = [
    [apex, left, 1],
    [left, right, -1],
    [right, apex, 1],
  ];

  return sides.map(([a, b, spin]) => {
    const c = centroidOf(a, b, g);
    const dx = c.x - g.x;
    const dy = c.y - g.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
      points: [a, b, g],
      driftDir: { x: dx / len, y: dy / len },
      centroid: c,
      spin,
    };
  });
}

/**
 * ArrowHeadDisintegrate — Fractura de la punta mientras sale del tablero.
 *
 * El triángulo se parte en 3 fragmentos que derivan hacia afuera, giran
 * ligeramente y se desvanecen, como si la punta se quebrara al cruzar la
 * salida. Dura ~150ms y aparece justo ANTES del ArrowBurst (estallido de
 * chispas): punta se quiebra → fragmentos derivan → estalla en chispas.
 */
export const ArrowHeadDisintegrate: React.FC<ArrowHeadDisintegrateProps> = ({
  center,
  color,
  cellSize,
  tipDir,
}) => {
  // Progreso 0 → 1 de la desintegración. Animado por rAF.
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    if (typeof requestAnimationFrame !== 'function') {
      return;
    }
    let raf = 0;
    const start = performance.now();
    const frame = (now: number): void => {
      const p = Math.min((now - start) / DISINTEGRATE_MS, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(frame);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const opacity = 1 - progress;
  if (opacity <= 0) {
    return null;
  }

  const fragments = buildFragments(center, tipDir, cellSize);
  // Deriva con salida suave: los fragmentos saltan al partirse y luego frenan.
  const drift = (1 - (1 - progress) * (1 - progress)) * DRIFT_RATIO * cellSize;

  return (
    <g data-testid="arrow-head-disintegrate" opacity={opacity}>
      {fragments.map((frag, i) => {
        const dx = frag.driftDir.x * drift;
        const dy = frag.driftDir.y * drift;
        const deg = frag.spin * MAX_SPIN_DEG * progress;
        return (
          <polygon
            key={i}
            points={frag.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={color}
            transform={`translate(${dx} ${dy}) rotate(${deg} ${frag.centroid.x} ${frag.centroid.y})`}
          />
        );
      })}
    </g>
  );
};
