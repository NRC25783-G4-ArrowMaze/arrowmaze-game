import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Point } from '../rendering/boardLayout';
import { extendRailForExit, sampleShapeOnRail } from '../rendering/railGlide';
import { buildBodyPath, buildHeadPoints } from '../rendering/arrowGlyphPath';
import { GLIDE_SPEED, EXIT_MARGIN_CELLS, exitOpacity } from '../rendering/glideConfig';
import { ARROW_GLYPH } from '../theme';

/**
 * ArrowExit — Overlay de la SALIDA VOLADORA de una flecha (Opción B, patrón
 * ArrowBurst): vive fuera de la flecha viva, así reproduce la salida COMPLETA
 * sin importar el timing del dominio (incluida la de 1 celda, cuya ventana de
 * ~1 tick no alcanzaría para nada dentro de la flecha).
 *
 * La forma completa (pre-shrink) se desliza por un riel EXTENDIDO con nodos
 * virtuales fuera del tablero, a la MISMA velocidad de crucero (GLIDE_SPEED, no
 * acelera ni frena en el borde), mientras se funde a transparente. Al terminar
 * llama `onDone` para que el contenedor lo desmonte (sin overlays huérfanos).
 *
 * Filosofía del riel: mismo guard/try-catch — jamás lanza; ante cualquier
 * inconsistencia, no pinta y termina. El recorte al rect del tablero lo aplica
 * el contenedor (BoardComponent), no este componente.
 */
export interface ArrowExitProps {
  /** Forma completa (centros px de las celdas, cola→punta) en el instante de salir. */
  centers: Point[];
  /** Dirección de salida (para el vuelo de una flecha de una sola celda). */
  exitDir: number;
  /** Color CSS del glifo. */
  color: string;
  /** Tamaño de celda en px. */
  cellSize: number;
  /** Se invoca UNA vez cuando la salida termina (para desmontar el overlay). */
  onDone: () => void;
}

export const ArrowExit: React.FC<ArrowExitProps> = ({
  centers,
  exitDir,
  color,
  cellSize,
  onDone,
}) => {
  const count = centers.length;
  const [arcOffset, setArcOffset] = useState(0);
  const doneRef = useRef(false);
  const rafRef = useRef(0);

  // Riel extendido y objetivo de vuelo, estables durante la vida del overlay.
  const rail = useMemo(
    () => extendRailForExit(centers, exitDir, EXIT_MARGIN_CELLS, cellSize),
    [centers, exitDir, cellSize],
  );
  // Distancia de vuelo (arco): el largo de la flecha + margen ⇒ sale entera y se funde.
  const flyTarget = (count + EXIT_MARGIN_CELLS) * cellSize;

  const finish = (): void => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;
    onDone();
  };

  /* eslint-disable react-hooks/set-state-in-effect --
     Sincroniza la animación externa (rAF) con React: el setState arranca/avanza
     el vuelo; en entornos sin rAF hace snap al final. Mismo caso legítimo que
     ArrowComponent. */
  useLayoutEffect(() => {
    if (count === 0 || flyTarget <= 0) {
      finish();
      return;
    }
    if (typeof requestAnimationFrame !== 'function') {
      setArcOffset(flyTarget); // sin rAF (tests): snap al final.
      finish();
      return;
    }
    const speed = (GLIDE_SPEED * cellSize) / 1000; // celdas/s → px/ms.
    let last = performance.now();
    const frame = (now: number): void => {
      const dt = now - last;
      last = now;
      setArcOffset((prev) => {
        const next = Math.min(prev + speed * dt, flyTarget);
        if (next >= flyTarget) {
          finish();
        }
        return next;
      });
      if (!doneRef.current) {
        rafRef.current = requestAnimationFrame(frame);
      }
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== 0) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (count === 0) {
    return null;
  }

  const progress = flyTarget > 0 ? arcOffset / flyTarget : 1;
  const opacity = exitOpacity(progress);
  if (opacity <= 0) {
    return null; // ya fundida; el loop terminará y desmontará.
  }

  // Muestreo protegido: si algo va mal, no pinta (nunca lanza y tumba el árbol).
  let shape;
  try {
    shape = sampleShapeOnRail(rail, arcOffset, count, cellSize);
  } catch {
    return null;
  }

  const bodyPath = buildBodyPath(shape.body);
  const tip = shape.vertices[shape.vertices.length - 1];
  const headPoints = buildHeadPoints(tip, shape.tipDir, cellSize);
  const strokeWidth = ARROW_GLYPH.bodyStrokeRatio * cellSize;

  return (
    <g data-testid="arrow-exit" opacity={opacity}>
      <path
        data-testid="arrow-exit-body"
        d={bodyPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon data-testid="arrow-exit-head" points={headPoints} fill={color} />
    </g>
  );
};
