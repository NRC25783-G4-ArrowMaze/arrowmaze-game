import React, { useLayoutEffect, useState } from 'react';
import type { Point } from '../rendering/boardLayout';

/** Duración del estallido de chispas (ms). Espeja BURST_MS de useGameController. */
const BURST_MS = 350;
/** Número de chispas que salen disparadas radialmente. */
const PARTICLE_COUNT = 9;
/** Distancia máxima de dispersión, como fracción de cellSize. */
const SPREAD_RATIO = 0.7;
/** Radio inicial de cada chispa, como fracción de cellSize. */
const PARTICLE_RADIUS_RATIO = 0.09;

/** Props de ArrowBurst: origen del estallido, color y escala. */
export interface ArrowBurstProps {
  /** Punto (px) donde estalla la flecha: su última posición de cabeza visible. */
  origin: Point;
  /** Color CSS de las chispas (el de la flecha que desapareció). */
  color: string;
  /** Tamaño de celda (px): escala dispersión y radio de las chispas. */
  cellSize: number;
}

/** Direcciones unitarias fijas y repartidas en círculo (deterministas). */
const DIRECTIONS: ReadonlyArray<{ x: number; y: number }> = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => {
    const angle = (2 * Math.PI * i) / PARTICLE_COUNT;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  },
);

/** Suavizado de salida (rápido al inicio, frena al final). */
function easeOut(p: number): number {
  return 1 - (1 - p) * (1 - p);
}

/**
 * ArrowBurst — Estallido efímero de chispas en el punto donde una flecha salió del
 * tablero. Es puramente estético: NO conoce el dominio; el board lo monta con
 * `key={nonce}` cuando llega la señal `vanishing`, y se desmonta solo al terminar.
 *
 * Se anima vía estado (progress) controlado por requestAnimationFrame, igual que el
 * recoil de colisión de ArrowComponent (React controla el trazo; no se manipula el
 * DOM imperativamente).
 */
export const ArrowBurst: React.FC<ArrowBurstProps> = ({ origin, color, cellSize }) => {
  // Progreso 0 → 1 del estallido. Animado por rAF.
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    if (typeof requestAnimationFrame !== 'function') {
      return; // Entornos sin rAF (p.ej. jsdom): no anima; el estado inicial es válido.
    }
    let raf = 0;
    const start = performance.now();
    const frame = (now: number): void => {
      const p = Math.min((now - start) / BURST_MS, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(frame);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const spread = SPREAD_RATIO * cellSize;
  const dist = easeOut(progress) * spread;
  const opacity = 1 - progress;
  const radius = PARTICLE_RADIUS_RATIO * cellSize * (1 - progress);

  if (radius <= 0 || opacity <= 0) {
    return null;
  }

  return (
    <g data-testid="arrow-burst">
      {DIRECTIONS.map((dir, i) => (
        <circle
          key={i}
          cx={origin.x + dir.x * dist}
          cy={origin.y + dir.y * dist}
          r={radius}
          fill={color}
          opacity={opacity}
        />
      ))}
    </g>
  );
};
