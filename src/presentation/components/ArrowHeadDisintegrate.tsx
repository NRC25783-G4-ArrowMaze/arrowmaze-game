import React, { useLayoutEffect, useState } from 'react';
import type { Point } from '../rendering/boardLayout';

/** Duración de la desintegración de la punta (ms). Aparece antes del burst. */
const DISINTEGRATE_MS = 150;

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

/**
 * ArrowHeadDisintegrate — Animación de desgaste/fractura de la punta mientras sale.
 *
 * La punta (triángulo) se desvanece con un efecto visual de "grietas" que se expanden,
 * como si se erosionara al pasar por la salida del tablero. Dura ~150ms y aparece
 * justo ANTES del ArrowBurst (estallido de chispas), creando una transición de
 * desintegración: punta se quiebra → fractura → estalla en chispas.
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

  const opacity = 1 - progress; // 1 → 0
  if (opacity <= 0) {
    return null;
  }

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

  // Ancho de línea de las grietas que crecen conforme avanza la desintegración.
  const crackWidth = 1 + progress * 2.5; // 1 → 3.5 px
  // Desplazamiento de las grietas (se expanden hacia afuera desde el centro).
  const crackExpand = progress * (cellSize * 0.2);

  // Grietas: líneas radiantes desde el centro del triángulo que lo fracturan.
  const centerX = center.x;
  const centerY = center.y;
  const cracks = [
    { x1: centerX, y1: centerY, x2: apex.x, y2: apex.y }, // grieta hacia punta
    { x1: centerX, y1: centerY, x2: left.x, y2: left.y }, // hacia vértice izq
    { x1: centerX, y1: centerY, x2: right.x, y2: right.y }, // hacia vértice der
    // Grietas adicionales (expansivas) que se expanden desde el triángulo hacia afuera.
    {
      x1: apex.x,
      y1: apex.y,
      x2: apex.x + dirX * crackExpand,
      y2: apex.y + dirY * crackExpand,
    },
  ];

  return (
    <g data-testid="arrow-head-disintegrate" opacity={opacity}>
      {/* Triángulo base (se va volviendo translúcido). */}
      <polygon
        points={`${apex.x},${apex.y} ${left.x},${left.y} ${right.x},${right.y}`}
        fill={color}
        opacity={opacity * 0.6} // más translúcido aún
      />

      {/* Grietas que fractúan el triángulo. */}
      {cracks.map((crack, i) => (
        <line
          key={i}
          x1={crack.x1}
          y1={crack.y1}
          x2={crack.x2}
          y2={crack.y2}
          stroke={color}
          strokeWidth={crackWidth}
          opacity={opacity * 0.8}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};
