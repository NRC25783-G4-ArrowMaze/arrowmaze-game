import React, { useLayoutEffect, useState } from 'react';
import { portDelta, type Point } from '../rendering/boardLayout';
import { BODY_STROKE_RATIO } from '../theme';

/** Geometría del triángulo de la cabeza, en fracciones de cellSize. */
const HEAD_TIP_RATIO = 0.5; // distancia del centro al apex
const HEAD_BACK_RATIO = 0.32; // distancia del centro al punto medio de la base
const HEAD_HALF_BASE_RATIO = 0.36; // mitad del ancho de la base

/** Coreografía del rebote de colisión (amago de avance siguiendo la forma). */
const RECOIL_MS = 200;
/**
 * Fracción de celda que la flecha amaga avanzar antes de regresar. El amago NO es
 * un translate de toda la figura: cada vértice se mueve hacia su PROPIA dirección
 * de avance (hacia el siguiente tramo), de modo que una flecha en L amaga "en L"
 * —el tramo horizontal avanza horizontal, el vertical avanza vertical— en vez de
 * levantarse entero hacia la punta.
 */
const RECOIL_FRACTION = 0.16;

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
   * Nonce de colisión: cambia cada vez que esta flecha queda bloqueada en un
   * slide. Al cambiar, dispara el rebote (recoil). `undefined` = sin colisión.
   */
  collideNonce?: number;
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
 * Vector de avance (px) de cada vértice si la flecha avanzara UN paso:
 * - Tramo interno (i < n-1): hacia el centro del siguiente segmento → el vértice
 *   se desliza a lo largo de su propio tramo (horizontal o vertical).
 * - Punta (i = n-1): en dirección del exitDir (una celda).
 *
 * Esto hace que el amago de colisión siga la FORMA de la flecha (una L amaga "en L").
 */
function advanceDeltas(centers: Point[], exitDir: number, cellSize: number): Point[] {
  const n = centers.length;
  const { dCol, dRow } = portDelta(exitDir);
  return centers.map((c, i) =>
    i < n - 1
      ? { x: centers[i + 1].x - c.x, y: centers[i + 1].y - c.y }
      : { x: dCol * cellSize, y: dRow * cellSize },
  );
}

/**
 * ArrowComponent — Pasada 2 del renderizado: una flecha completa, dibujada sobre
 * la grilla de puntos.
 *
 * Orden de dibujo (spec B1): primero el cuerpo, luego la cabeza, de modo que el
 * triángulo de la cabeza solape el cap del cuerpo en la celda-cabeza. El color del
 * cuerpo y de la cabeza vienen del dato (sin fallback).
 *
 * El AVANCE se anima reproyectando la forma REAL del dominio entre ticks
 * (useGameController). La COLISIÓN es un amago efímero que sigue la forma: cuando
 * `collideNonce` cambia, cada vértice avanza una fracción hacia su propio tramo y
 * regresa. Se anima vía estado (recoilF) para que React controle el trazo de forma
 * coherente (no se manipula el DOM imperativamente, que competiría con el render).
 */
export const ArrowComponent: React.FC<ArrowComponentProps> = ({
  color,
  centers,
  exitDir,
  cellSize,
  collideNonce,
}) => {
  // Fracción de amago actual (0 = reposo). Animada por rAF durante la colisión.
  const [recoilF, setRecoilF] = useState(0);

  useLayoutEffect(() => {
    if (collideNonce === undefined || centers.length === 0) {
      return;
    }
    if (typeof requestAnimationFrame !== 'function') {
      return; // Entornos sin rAF (p.ej. jsdom viejo): el estado de reposo ya es correcto.
    }
    let raf = 0;
    const start = performance.now();
    const frame = (now: number): void => {
      const p = Math.min((now - start) / RECOIL_MS, 1);
      // Envolvente 0 → F → 0 (pico suave a mitad): amago de ida y vuelta.
      setRecoilF(RECOIL_FRACTION * Math.sin(p * Math.PI));
      if (p < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setRecoilF(0);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      setRecoilF(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collideNonce]);

  if (centers.length === 0) {
    return null;
  }

  // Durante el amago, cada vértice se desplaza recoilF hacia su dirección de avance
  // (siguiendo la forma). En reposo (recoilF === 0) se usan los centros tal cual.
  const drawCenters =
    recoilF === 0
      ? centers
      : advanceDeltas(centers, exitDir, cellSize).map((d, i) => ({
          x: centers[i].x + d.x * recoilF,
          y: centers[i].y + d.y * recoilF,
        }));

  const bodyPath = buildBodyPath(drawCenters);
  // La punta visual va en la celda LÍDER (última en orden de ocupación), no en la
  // celda-cabeza del dominio, que en este motor ocupa el extremo trasero.
  const tipCenter = drawCenters[drawCenters.length - 1];
  const headPoints = buildHeadPoints(tipCenter, tipDirection(drawCenters, exitDir), cellSize);

  return (
    <g data-testid="arrow">
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
