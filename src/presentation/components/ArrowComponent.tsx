import React, { useLayoutEffect, useRef, useState } from 'react';
import { portDelta, type Point } from '../rendering/boardLayout';
import { sampleShapeOnRail } from '../rendering/railGlide';
import { GLIDE_SPEED } from '../rendering/glideConfig';
import { buildBodyPath, tipDirection, buildHeadPoints } from '../rendering/arrowGlyphPath';
import { ARROW_GLYPH } from '../theme';

/**
 * Coreografía del rebote de colisión (amago de avance + deformación siguiendo la
 * forma). Recalibrada al glifo reducido (ARROW_SCALE=0.55): con la flecha más
 * pequeña, la deformación agresiva del glifo 1.0 se sentía exagerada; estos
 * valores dan un impacto más contenido y proporcionado.
 */
const RECOIL_MS = 160;
/**
 * Fracción de celda que la flecha amaga avanzar antes de regresar. El amago NO es
 * un translate de toda la figura: cada vértice se mueve hacia su PROPIA dirección
 * de avance (hacia el siguiente tramo), de modo que una flecha en L amaga "en L"
 * —el tramo horizontal avanza horizontal, el vertical avanza vertical— en vez de
 * levantarse entero hacia la punta.
 */
const RECOIL_FRACTION = 0.1;
/** Máximo engrosamiento del cuerpo durante la deformación por impacto (como fracción del stroke). */
const DEFORM_STROKE_RATIO = 0.2; // 20% más grueso en el pico
/** Máxima compresión de la punta durante la deformación (la punta se vuelve más pequeña). */
const DEFORM_HEAD_RATIO = 0.15; // 15% más pequeño en el pico

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

  // ── Riel persistente + offset continuo ──────────────────────────────────
  // El riel acumula los centros de celda que el dominio proyecta durante el
  // slide. La forma dibujada es una VENTANA sobre el riel a `arcOffset` (arco
  // del vértice trasero); un rAF persigue ese offset hacia `target` a velocidad
  // constante (GLIDE_SPEED). Cada avance de un paso APPENDEA la celda líder y
  // suma un paso al target; el retroceso (glide-back de colisión) recorre los
  // MISMOS nodos ya presentes restando un paso. Un retarget en vuelo solo mueve
  // el target: el offset sigue desde su valor actual → cero reinicios, cero
  // fallback en cadena (los giros dejan de partirse en slides largos).
  const [arcOffset, setArcOffset] = useState(0);
  // ¿La flecha se está moviendo (offset persiguiendo target)? Solo en movimiento
  // el riel dirige la cabeza; en reposo la orientación la dicta el dominio.
  const [moving, setMoving] = useState(false);
  // Espejo del riel para el RENDER (leer refs en render viola react-hooks/refs).
  // Los refs son la verdad síncrona dentro de los effects; este estado se
  // actualiza en cada cambio estructural del riel para que el render lo consuma.
  const [railState, setRailState] = useState<{ rail: Point[]; count: number } | null>(
    null,
  );
  const railRef = useRef<Point[] | null>(null);
  const railCountRef = useRef(0);
  const prevCentersRef = useRef<Point[] | null>(null);
  const targetRef = useRef(0);
  const offsetRef = useRef(0);
  const cellSizeRef = useRef(cellSize);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  const centersKey = centers.map((p) => `${p.x},${p.y}`).join(';');

  const clonePts = (pts: Point[]): Point[] => pts.map((p) => ({ x: p.x, y: p.y }));
  const setOffset = (v: number): void => {
    offsetRef.current = v;
    setArcOffset(v);
  };
  const stopLoop = (): void => {
    if (rafRef.current !== 0) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = 0;
    runningRef.current = false;
    setMoving(false);
  };
  // Persigue `target` a velocidad constante (px/ms), en cualquier sentido. Sin
  // easing por tick: los ticks encadenan sin costura (resuelve la Fase B).
  const startLoop = (): void => {
    if (runningRef.current) {
      return; // ya animando: el nuevo target se persigue sin reiniciar.
    }
    if (typeof requestAnimationFrame !== 'function') {
      setOffset(targetRef.current); // entornos sin rAF (jsdom): snap.
      setMoving(false); // snap ⇒ reposo inmediato.
      return;
    }
    runningRef.current = true;
    setMoving(true);
    const speed = (GLIDE_SPEED * cellSize) / 1000; // celdas/s → px/ms.
    let last = performance.now();
    const frame = (now: number): void => {
      const dt = now - last;
      last = now;
      const target = targetRef.current;
      let off = offsetRef.current;
      if (off < target) {
        off = Math.min(off + speed * dt, target);
      } else if (off > target) {
        off = Math.max(off - speed * dt, target);
      }
      setOffset(off);
      if (Math.abs(off - targetRef.current) > 1e-6) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        runningRef.current = false;
        rafRef.current = 0;
        setMoving(false); // objetivo alcanzado ⇒ reposo.
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  };

  useLayoutEffect(() => stopLoop, []);

  /* eslint-disable react-hooks/set-state-in-effect --
     Reconciliación prop→animación: este effect sincroniza el riel persistente
     (railState) y el offset con el sistema externo de animación (rAF). Es el
     caso legítimo que la propia regla contempla (sincronizar React con un
     sistema externo); el setState arranca la animación, que a partir de ahí se
     autoconduce por callbacks de rAF. */
  useLayoutEffect(() => {
    const curr = centers;
    const prev = prevCentersRef.current;
    prevCentersRef.current = clonePts(curr);
    const n = curr.length;

    // Reset + snap: primer render, cambio de nº de celdas/cellSize, o movimiento
    // que no es avance/retroceso de un paso (teleport/restart).
    const reset = (): void => {
      stopLoop();
      railRef.current = clonePts(curr);
      railCountRef.current = n;
      targetRef.current = 0;
      cellSizeRef.current = cellSize;
      setRailState({ rail: railRef.current, count: n });
      setOffset(0);
    };

    if (n === 0) {
      stopLoop();
      railRef.current = null;
      setRailState(null);
      return;
    }
    if (
      prev === null ||
      prev.length !== n ||
      cellSize !== cellSizeRef.current ||
      railRef.current === null
    ) {
      reset();
      return;
    }
    const moved = prev.some((p, i) => p.x !== curr[i].x || p.y !== curr[i].y);
    if (!moved) {
      return;
    }
    // ¿Avance de un paso? curr[i] === prev[i+1] (la forma se corre una celda).
    let forward = true;
    for (let i = 0; i < n - 1; i++) {
      if (prev[i + 1].x !== curr[i].x || prev[i + 1].y !== curr[i].y) {
        forward = false;
        break;
      }
    }
    // ¿Retroceso de un paso? curr[i] === prev[i-1] (glide-back de colisión).
    let backward = true;
    for (let i = 1; i < n; i++) {
      if (prev[i - 1].x !== curr[i].x || prev[i - 1].y !== curr[i].y) {
        backward = false;
        break;
      }
    }

    if (forward) {
      // Arranque desde reposo: compacta el riel a la ventana actual (acota la
      // memoria) sin salto visual (offset 0 ⇒ ventana == forma en reposo).
      if (!runningRef.current) {
        railRef.current = clonePts(prev);
        railCountRef.current = n;
        targetRef.current = 0;
        offsetRef.current = 0;
      }
      railRef.current = [...railRef.current!, { x: curr[n - 1].x, y: curr[n - 1].y }];
      railCountRef.current = n;
      targetRef.current += cellSize;
      setRailState({ rail: railRef.current, count: n });
      setOffset(offsetRef.current);
      startLoop();
      return;
    }
    if (backward && targetRef.current - cellSize >= -1e-6) {
      // Los nodos del retroceso ya están en el riel: solo mueve el target atrás.
      targetRef.current -= cellSize;
      startLoop();
      return;
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centersKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  if (centers.length === 0) {
    return null;
  }

  // Forma dibujada: ventana del riel persistente en `arcOffset`, leída del ESTADO
  // espejo (railState), no de refs. Guard estructural: el riel debe existir, casar
  // en nº de celdas y tener ≥2 nodos (dirección de tramo válida). Ante CUALQUIER
  // estado inconsistente o excepción → shape=null y se cae a snap sobre `centers`.
  // La animación es cosmética: nunca puede lanzar y tumbar el árbol de React.
  const shape: ReturnType<typeof sampleShapeOnRail> | null = (() => {
    if (
      railState === null ||
      railState.count !== centers.length ||
      railState.rail.length < 2
    ) {
      return null;
    }
    try {
      return sampleShapeOnRail(railState.rail, arcOffset, centers.length, cellSize);
    } catch {
      return null; // snap silencioso; la próxima reconciliación reconstruye el riel.
    }
  })();
  const baseCenters = shape !== null ? shape.vertices : centers;

  // Durante el amago de colisión, cada vértice se desplaza recoilF hacia su
  // dirección de avance (siguiendo la forma). En reposo se usa la forma tal cual.
  const drawCenters =
    recoilF === 0
      ? baseCenters
      : advanceDeltas(baseCenters, exitDir, cellSize).map((d, i) => ({
          x: baseCenters[i].x + d.x * recoilF,
          y: baseCenters[i].y + d.y * recoilF,
        }));

  // Factor de deformación por impacto (0 en reposo, máximo en pico del rebote).
  const deform = deformationFactor(recoilF);

  // El riel traza el CUERPO y ubica la punta (correcto también en reposo). Pero
  // la DIRECCIÓN de la cabeza solo la toma del riel EN MOVIMIENTO (`moving`): así
  // la punta gira al doblar mientras se desliza, pero en REPOSO la orientación la
  // dicta el dominio (exitDir) — tras un glide-back el último tramo del riel puede
  // apuntar hacia atrás y la animación jamás decide hacia dónde mira una quieta.
  const useRailBody = recoilF === 0 && shape !== null;
  const bodyPath = buildBodyPath(useRailBody ? shape.body : drawCenters);
  // La punta visual va en la celda LÍDER (última en orden de ocupación), no en la
  // celda-cabeza del dominio, que en este motor ocupa el extremo trasero.
  const tipCenter = useRailBody
    ? shape.vertices[shape.vertices.length - 1]
    : drawCenters[drawCenters.length - 1];
  const headDir =
    moving && useRailBody ? shape.tipDir : tipDirection(drawCenters, exitDir);
  // Compresión de la punta durante el impacto (1 = sin comprimir).
  const headCompression = 1 - DEFORM_HEAD_RATIO * deform;
  const headPoints = buildHeadPoints(tipCenter, headDir, cellSize, headCompression);

  // Engrosamiento del cuerpo durante el impacto (simula compresión).
  const bodyStrokeWidth =
    ARROW_GLYPH.bodyStrokeRatio * cellSize * (1 + DEFORM_STROKE_RATIO * deform);

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
