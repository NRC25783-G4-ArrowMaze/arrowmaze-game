import React, { useLayoutEffect, useState } from 'react';
import type { Point } from '../rendering/boardLayout';

/** Duración del estallido de chispas (ms). Espeja BURST_MS de useGameController. */
const BURST_MS = 350;
/** Número de chispas que salen disparadas radialmente. */
const PARTICLE_COUNT = 12;
/** Distancia máxima de dispersión (anillo exterior), como fracción de cellSize. */
const SPREAD_RATIO = 0.85;
/** Radio inicial de cada chispa, como fracción de cellSize. */
const PARTICLE_RADIUS_RATIO = 0.09;
/** Radio final de la onda expansiva (anillo), como fracción de cellSize. */
const RING_RATIO = 0.55;

/** Props de ArrowBurst: origen del estallido, color y escala. */
export interface ArrowBurstProps {
  /** Punto (px) donde estalla la flecha: su última posición de cabeza visible. */
  origin: Point;
  /** Color CSS de las chispas (el de la flecha que desapareció). */
  color: string;
  /** Tamaño de celda (px): escala dispersión y radio de las chispas. */
  cellSize: number;
}

/** Descripción estática de una chispa: dirección + variación de alcance y tamaño. */
interface Particle {
  dir: { x: number; y: number };
  /** Fracción del spread máximo que alcanza esta chispa (anillo interior/exterior). */
  distScale: number;
  /** Multiplicador del radio base (chispas grandes y pequeñas mezcladas). */
  sizeScale: number;
}

/**
 * Chispas deterministas pero NO uniformes: se alternan dos anillos (exterior
 * completo e interior desfasado medio paso angular) con tamaños alternados,
 * para que el estallido se lea orgánico sin introducir aleatoriedad (los tests
 * y los replays ven siempre el mismo dibujo).
 */
const PARTICLES: ReadonlyArray<Particle> = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => {
    const outer = i % 2 === 0;
    const angle = (2 * Math.PI * i) / PARTICLE_COUNT + (outer ? 0 : Math.PI / PARTICLE_COUNT);
    return {
      dir: { x: Math.cos(angle), y: Math.sin(angle) },
      distScale: outer ? 1 : 0.55,
      sizeScale: i % 3 === 0 ? 1.3 : i % 3 === 1 ? 0.8 : 1,
    };
  },
);

/** Suavizado de salida cúbico (arranque explosivo, frena al final). */
function easeOutCubic(p: number): number {
  const q = 1 - p;
  return 1 - q * q * q;
}

/**
 * ArrowBurst — Estallido efímero de chispas en el punto donde una flecha salió del
 * tablero. Es puramente estético: NO conoce el dominio; el board lo monta con
 * `key={nonce}` cuando llega la señal `vanishing`, y se desmonta solo al terminar.
 *
 * Composición: una onda expansiva (anillo que crece y se adelgaza) + chispas en
 * dos anillos con tamaños variados. El fade usa una curva (1-p)^1.5 para que las
 * chispas conserven presencia al inicio y mueran rápido al final.
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
      // El timestamp del primer frame puede ser ANTERIOR al performance.now()
      // capturado arriba: sin el clamp inferior, un progreso negativo produce
      // radios negativos en el anillo (error de <circle> en consola).
      const p = Math.min(Math.max((now - start) / BURST_MS, 0), 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(frame);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const spread = SPREAD_RATIO * cellSize;
  const dist = easeOutCubic(progress) * spread;
  const opacity = Math.pow(1 - progress, 1.5);
  const baseRadius = PARTICLE_RADIUS_RATIO * cellSize * (1 - progress);

  if (baseRadius <= 0 || opacity <= 0) {
    return null;
  }

  // Onda expansiva: crece rápido y se desvanece antes que las chispas.
  const ringRadius = easeOutCubic(progress) * RING_RATIO * cellSize;
  const ringOpacity = Math.pow(1 - progress, 2.5);
  const ringWidth = Math.max(cellSize * 0.06 * (1 - progress), 0.5);

  return (
    <g data-testid="arrow-burst">
      {ringOpacity > 0.01 && (
        <circle
          cx={origin.x}
          cy={origin.y}
          r={ringRadius}
          fill="none"
          stroke={color}
          strokeWidth={ringWidth}
          opacity={ringOpacity}
        />
      )}
      {PARTICLES.map((particle, i) => (
        <circle
          key={i}
          cx={origin.x + particle.dir.x * dist * particle.distScale}
          cy={origin.y + particle.dir.y * dist * particle.distScale}
          r={baseRadius * particle.sizeScale}
          fill={color}
          opacity={opacity}
        />
      ))}
    </g>
  );
};
