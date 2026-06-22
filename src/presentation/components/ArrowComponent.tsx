import React, { useLayoutEffect, useRef } from 'react';
import { portDelta, type Point } from '../rendering/boardLayout';
import { BODY_STROKE_RATIO } from '../theme';
import type { ArrowMotion } from '../animation/motion';

/** Geometría del triángulo de la cabeza, en fracciones de cellSize. */
const HEAD_TIP_RATIO = 0.5; // distancia del centro al apex
const HEAD_BACK_RATIO = 0.32; // distancia del centro al punto medio de la base
const HEAD_HALF_BASE_RATIO = 0.36; // mitad del ancho de la base

/** Props de ArrowComponent: view-model de presentación de UNA flecha. */
export interface ArrowComponentProps {
  /** Color CSS de la flecha (cuerpo + cabeza). Viene del dato, sin fallback. */
  color: string;
  /**
   * Centros (px) de las celdas ocupadas, en orden de ocupación.
   * El índice 0 es la celda-cabeza; el último es la cola.
   */
  centers: Point[];
  /** Puerto de salida de la cabeza (exitDir); define la dirección del apex. */
  exitDir: number;
  /** Tamaño de celda en píxeles (escala grosor del cuerpo y tamaño de la cabeza). */
  cellSize: number;
  /**
   * Plan de animación del tick (B2). Si está presente, el grupo de la flecha
   * reproduce la coreografía (glide/recoil/fade). Ausente → render estático (B1).
   */
  motion?: ArrowMotion;
}

/**
 * Construye los keyframes de la coreografía según el tipo de movimiento.
 * - glide:  parte desplazada -delta (posición previa) y converge a identidad (post).
 * - recoil: empuja +delta y regresa a identidad (spring-back). Sin flash ni shake.
 * - fade:   deriva +delta mientras la opacidad cae a 0 (se queda invisible).
 */
function motionKeyframes(motion: ArrowMotion): {
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
} {
  const to = `translate(${motion.dx}px, ${motion.dy}px)`;
  const from = `translate(${-motion.dx}px, ${-motion.dy}px)`;

  switch (motion.kind) {
    case 'glide':
      return {
        frames: [{ transform: from }, { transform: 'translate(0px, 0px)' }],
        options: { duration: motion.durationMs, easing: 'ease-out', fill: 'none' },
      };
    case 'recoil':
      return {
        frames: [
          { transform: 'translate(0px, 0px)' },
          { transform: to, offset: 0.4 },
          { transform: 'translate(0px, 0px)' },
        ],
        options: { duration: motion.durationMs, easing: 'ease-in-out', fill: 'none' },
      };
    case 'fade':
      return {
        frames: [
          { transform: 'translate(0px, 0px)', opacity: 1 },
          { transform: to, opacity: 0 },
        ],
        options: { duration: motion.durationMs, easing: 'ease-in', fill: 'forwards' },
      };
  }
}

/**
 * Construye el atributo `d` del cuerpo uniendo centros en orden con segmentos rectos.
 *
 * Caso de una sola celda: se emite `M x,y L x,y` (línea de longitud cero) para que
 * `stroke-linecap: round` produzca un punto/cap redondo visible (spec B1).
 */
function buildBodyPath(centers: Point[]): string {
  if (centers.length === 0) {
    return '';
  }
  const [first, ...rest] = centers;
  if (rest.length === 0) {
    // Flecha de una sola celda: punto con cap redondo.
    return `M ${first.x},${first.y} L ${first.x},${first.y}`;
  }
  const move = `M ${first.x},${first.y}`;
  const lines = rest.map((p) => `L ${p.x},${p.y}`).join(' ');
  return `${move} ${lines}`;
}

/**
 * Dirección unitaria (en pantalla) hacia la que apunta la punta de la flecha.
 *
 * En este motor la cabeza (Head) ocupa la celda TRASERA y el cuerpo se extiende
 * hacia adelante (en dirección del exitPort), así que la "punta" visual va en la
 * celda LÍDER. Su orientación se toma del último tramo del shaft (de la penúltima
 * a la última celda); para una flecha de una sola celda se usa portDelta(exitDir).
 */
function tipDirection(centers: Point[], exitDir: number): { x: number; y: number } {
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
 * Construye los puntos del polígono triangular de la punta, centrado en `center`
 * (la celda líder) y orientado según el vector unitario `dir`.
 */
function buildHeadPoints(
  center: Point,
  dir: { x: number; y: number },
  cellSize: number,
): string {
  const dirX = dir.x;
  const dirY = dir.y;
  // Perpendicular unitaria para abrir la base.
  const perpX = -dirY;
  const perpY = dirX;

  const tip = HEAD_TIP_RATIO * cellSize;
  const back = HEAD_BACK_RATIO * cellSize;
  const half = HEAD_HALF_BASE_RATIO * cellSize;

  const apex: Point = { x: center.x + dirX * tip, y: center.y + dirY * tip };
  const baseMid: Point = { x: center.x - dirX * back, y: center.y - dirY * back };
  const left: Point = { x: baseMid.x + perpX * half, y: baseMid.y + perpY * half };
  const right: Point = { x: baseMid.x - perpX * half, y: baseMid.y - perpY * half };

  return `${apex.x},${apex.y} ${left.x},${left.y} ${right.x},${right.y}`;
}

/**
 * ArrowComponent — Pasada 2 del renderizado: una flecha completa, dibujada sobre
 * la grilla de puntos.
 *
 * Orden de dibujo (spec B1): primero el cuerpo, luego la cabeza, de modo que el
 * triángulo de la cabeza solape el cap del cuerpo en la celda-cabeza. El color del
 * cuerpo y de la cabeza vienen del dato (sin fallback).
 */
export const ArrowComponent: React.FC<ArrowComponentProps> = ({
  color,
  centers,
  exitDir,
  cellSize,
  motion,
}) => {
  const groupRef = useRef<SVGGElement | null>(null);

  // Reproduce la coreografía del tick vía Web Animations API. Se usa layout
  // effect para fijar el primer keyframe antes del primer paint (sin parpadeo
  // en glide). La animación es puramente visual: no escribe al dominio.
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (motion === undefined || group === null) {
      return;
    }
    // Entornos sin WAAPI (p.ej. jsdom): se omite, el estado final ya es correcto.
    if (typeof group.animate !== 'function') {
      return;
    }
    const { frames, options } = motionKeyframes(motion);
    const animation = group.animate(frames, options);
    return () => animation.cancel();
  }, [motion]);

  if (centers.length === 0) {
    return null;
  }

  const bodyPath = buildBodyPath(centers);
  // La punta visual va en la celda LÍDER (última en orden de ocupación), no en la
  // celda-cabeza del dominio, que en este motor ocupa el extremo trasero.
  const tipCenter = centers[centers.length - 1];
  const headPoints = buildHeadPoints(tipCenter, tipDirection(centers, exitDir), cellSize);

  return (
    <g data-testid="arrow" ref={groupRef}>
      {/* Cuerpo: trazo grueso redondeado, sin relleno. Se dibuja PRIMERO. */}
      <path
        data-testid="arrow-body"
        d={bodyPath}
        fill="none"
        stroke={color}
        strokeWidth={BODY_STROKE_RATIO * cellSize}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Punta: triángulo relleno en la celda líder. Se dibuja DESPUÉS para solapar el cap. */}
      <polygon data-testid="arrow-head" points={headPoints} fill={color} />
    </g>
  );
};
