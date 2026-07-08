import React, { useLayoutEffect, useRef, useState } from 'react';
import { portDelta, type Point } from '../rendering/boardLayout';
import { BODY_STROKE_RATIO } from '../theme';

/** Geometría del triángulo de la cabeza, en fracciones de cellSize. */
const HEAD_TIP_RATIO = 0.5; // distancia del centro al apex
const HEAD_BACK_RATIO = 0.32; // distancia del centro al punto medio de la base
const HEAD_HALF_BASE_RATIO = 0.36; // mitad del ancho de la base

/**
 * Duración del glide entre ticks del slide (ms). Debe ser ≤ TICK_MS de
 * useGameController (90 ms) para que la interpolación de un tick termine antes
 * de que llegue el siguiente y el movimiento se lea continuo, no a saltos.
 */
const SLIDE_MS = 85;

/** Coreografía del rebote de colisión (amago de avance + deformación siguiendo la forma). */
const RECOIL_MS = 200;
/**
 * Fracción de celda que la flecha amaga avanzar antes de regresar. El amago NO es
 * un translate de toda la figura: cada vértice se mueve hacia su PROPIA dirección
 * de avance (hacia el siguiente tramo), de modo que una flecha en L amaga "en L"
 * —el tramo horizontal avanza horizontal, el vertical avanza vertical— en vez de
 * levantarse entero hacia la punta.
 */
const RECOIL_FRACTION = 0.16;
/** Máximo engrosamiento del cuerpo durante la deformación por impacto (como fracción del stroke). */
const DEFORM_STROKE_RATIO = 0.5; // 50% más grueso en el pico
/** Máxima compresión de la punta durante la deformación (la punta se vuelve más pequeña). */
const DEFORM_HEAD_RATIO = 0.4; // 40% más pequeño en el pico

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
 * Opcionalmente aplica deformación por impacto (la punta se comprime).
 */
function buildHeadPoints(
  center: Point,
  dir: { x: number; y: number },
  cellSize: number,
  deformFactor: number = 0,
): string {
  const dirX = dir.x;
  const dirY = dir.y;
  // Perpendicular unitaria para abrir la base.
  const perpX = -dirY;
  const perpY = dirX;

  // Aplica compresión: cuanto mayor sea deformFactor, más pequeño es el triángulo.
  const compressionRatio = 1 - DEFORM_HEAD_RATIO * deformFactor;
  const tip = HEAD_TIP_RATIO * cellSize * compressionRatio;
  const back = HEAD_BACK_RATIO * cellSize * compressionRatio;
  const half = HEAD_HALF_BASE_RATIO * cellSize * compressionRatio;

  const apex: Point = { x: center.x + dirX * tip, y: center.y + dirY * tip };
  const baseMid: Point = { x: center.x - dirX * back, y: center.y - dirY * back };
  const left: Point = { x: baseMid.x + perpX * half, y: baseMid.y + perpY * half };
  const right: Point = { x: baseMid.x - perpX * half, y: baseMid.y - perpY * half };

  return `${apex.x},${apex.y} ${left.x},${left.y} ${right.x},${right.y}`;
}

/**
 * Factor de deformación por impacto: cuánto se comprime/deforma la flecha en el rebote.
 * Máximo cuando recoilF es máximo (mitad del bounce), cero en reposo.
 * Usa una envolvente suave para que la deformación "pique" en el impacto.
 */
function deformationFactor(recoilF: number): number {
  // recoilF va 0 → RECOIL_FRACTION → 0
  // Normalizamos: recoilNormalized = recoilF / RECOIL_FRACTION (0 → 1 → 0)
  const normalized = Math.min(recoilF / RECOIL_FRACTION, 1);
  // Retornamos una parábola: normalized² para un pico suave en el impacto
  return normalized * normalized;
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
 * (useGameController); entre una proyección y la siguiente, la forma se
 * interpola (glide de SLIDE_MS) para que el movimiento se lea continuo. La COLISIÓN es un amago efímero que sigue la forma: cuando
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

  // Glide entre ticks: al cambiar `centers` (mismo nº de celdas), la forma se
  // interpola desde la última posición DIBUJADA hacia la nueva en SLIDE_MS, en
  // vez de saltar. `from` es el snapshot de origen; `t` el progreso 0 → 1.
  const [glide, setGlide] = useState<{ from: Point[]; t: number } | null>(null);
  // Última forma efectivamente dibujada (incluye posiciones intermedias del glide).
  const drawnRef = useRef<Point[] | null>(null);
  const centersKey = centers.map((p) => `${p.x},${p.y}`).join(';');

  useLayoutEffect(() => {
    const prev = drawnRef.current;
    if (
      prev === null ||
      prev.length !== centers.length ||
      typeof requestAnimationFrame !== 'function'
    ) {
      // Primer render, cambio de nº de celdas o entorno sin rAF: snap directo.
      setGlide(null);
      return;
    }
    const moved = prev.some((p, i) => p.x !== centers[i].x || p.y !== centers[i].y);
    if (!moved) {
      return;
    }
    const from = prev.map((p) => ({ x: p.x, y: p.y }));
    // Arranque síncrono (antes del paint): evita un frame pintado en el destino.
    setGlide({ from, t: 0 });
    let raf = 0;
    const start = performance.now();
    const frame = (now: number): void => {
      const p = Math.min((now - start) / SLIDE_MS, 1);
      if (p < 1) {
        setGlide({ from, t: p });
        raf = requestAnimationFrame(frame);
      } else {
        setGlide(null);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centersKey]);

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
      // Envolvente 0 → F → 0 asimétrica: p^0.7 adelanta el pico (~38% del
      // tiempo), así el impacto "pica" rápido y la recuperación es más lenta.
      setRecoilF(RECOIL_FRACTION * Math.sin(Math.pow(p, 0.7) * Math.PI));
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

  // Base del dibujo: durante el glide, cada vértice se interpola (con salida
  // suave) desde su última posición dibujada hacia la nueva; en reposo son los
  // centros tal cual. La interpolación es solo estética: el dominio ya está en
  // la celda destino.
  const glideEase = glide === null ? 1 : 1 - (1 - glide.t) * (1 - glide.t);
  const baseCenters =
    glide === null || glide.from.length !== centers.length
      ? centers
      : centers.map((c, i) => ({
          x: glide.from[i].x + (c.x - glide.from[i].x) * glideEase,
          y: glide.from[i].y + (c.y - glide.from[i].y) * glideEase,
        }));
  // Registra la forma que se va a pintar en ESTE commit; corre después del
  // effect del glide (orden de declaración), así aquel siempre lee la posición
  // dibujada del commit anterior al arrancar una nueva interpolación.
  useLayoutEffect(() => {
    drawnRef.current = centers.length > 0 ? baseCenters : null;
  });

  if (centers.length === 0) {
    return null;
  }

  // Durante el amago, cada vértice se desplaza recoilF hacia su dirección de avance
  // (siguiendo la forma). En reposo (recoilF === 0) se usan los centros tal cual.
  const drawCenters =
    recoilF === 0
      ? baseCenters
      : advanceDeltas(baseCenters, exitDir, cellSize).map((d, i) => ({
          x: baseCenters[i].x + d.x * recoilF,
          y: baseCenters[i].y + d.y * recoilF,
        }));

  // Factor de deformación por impacto (0 en reposo, máximo en pico del rebote).
  const deform = deformationFactor(recoilF);

  const bodyPath = buildBodyPath(drawCenters);
  // La punta visual va en la celda LÍDER (última en orden de ocupación), no en la
  // celda-cabeza del dominio, que en este motor ocupa el extremo trasero.
  const tipCenter = drawCenters[drawCenters.length - 1];
  const headPoints = buildHeadPoints(
    tipCenter,
    tipDirection(drawCenters, exitDir),
    cellSize,
    deform, // aplica compresión de la punta
  );

  // Engrosamiento del cuerpo durante el impacto (simula compresión).
  const bodyStrokeWidth = BODY_STROKE_RATIO * cellSize * (1 + DEFORM_STROKE_RATIO * deform);

  return (
    <g data-testid="arrow">
      {/* Cuerpo: trazo grueso redondeado, sin relleno. Se dibuja PRIMERO. */}
      <path
        data-testid="arrow-body"
        d={bodyPath}
        fill="none"
        stroke={color}
        strokeWidth={bodyStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Punta: triángulo relleno en la celda líder. Se dibuja DESPUÉS para solapar el cap. */}
      <polygon data-testid="arrow-head" points={headPoints} fill={color} />
    </g>
  );
};
