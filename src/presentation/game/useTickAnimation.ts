import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';
import type { ArrowView } from '../viewModel';
import { buildArrowMotion, type ArrowMotion } from '../animation/motion';

/** Parámetros de un tick a animar (capturados ANTES de mutar el dominio). */
export interface RunTickParams {
  arrowId: string;
  /** Snapshot de la flecha ANTES del tick (para el ghost de destroyed). */
  preArrow: ArrowView;
  /** Outcome devuelto por el motor para este tick. */
  outcome: AdvanceOutcome;
  /** Tamaño de celda en píxeles (para escalar el desplazamiento). */
  cellSize: number;
}

/** Estado y acciones de la capa de animación de ticks. */
export interface TickAnimationState {
  /** True durante la ventana de animación: bloquea input y el siguiente tick. */
  inFlight: boolean;
  /** Plan de movimiento por id de flecha (solo la flecha del tick en curso). */
  motions: ReadonlyMap<string, ArrowMotion>;
  /**
   * Flecha "fantasma" a re-inyectar en el view-model durante un fade de destroyed
   * (el motor ya la eliminó, pero debe verse desvanecer). Null si no aplica.
   */
  ghostArrow: ArrowView | null;
  /** Si las animaciones están activas. Desactivarlas deja el estado final idéntico. */
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  /** Inicia la animación de un tick ya ejecutado por el motor. */
  run: (params: RunTickParams) => void;
}

/**
 * useTickAnimation — Coreografía visual BLOQUEANTE de un tick (B2).
 *
 * Modelo: la presentación es el "caller". El motor ya ejecutó el tick (mutó el
 * dominio); este hook solo anima la transición pre→post y mantiene `inFlight`
 * durante la ventana, de modo que el input y el siguiente tick queden bloqueados.
 *
 * Determinismo: NO escribe al dominio. Si `enabled` es false, no anima y no
 * bloquea: el estado final renderizado es idéntico al del motor.
 */
export function useTickAnimation(): TickAnimationState {
  const [inFlight, setInFlight] = useState(false);
  const [motions, setMotions] = useState<ReadonlyMap<string, ArrowMotion>>(
    new Map(),
  );
  const [ghostArrow, setGhostArrow] = useState<ArrowView | null>(null);
  const [enabled, setEnabled] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia cualquier temporizador pendiente al desmontar.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const run = useCallback(
    ({ arrowId, preArrow, outcome, cellSize }: RunTickParams) => {
      if (!enabled) {
        return; // Animaciones desactivadas: sin ventana de bloqueo.
      }

      const motion = buildArrowMotion(outcome, preArrow.exitDir, cellSize);
      setMotions(new Map([[arrowId, motion]]));
      // En destroyed el motor ya quitó la flecha: la re-inyectamos para el fade.
      setGhostArrow(outcome === 'destroyed' ? preArrow : null);
      setInFlight(true);

      timerRef.current = setTimeout(() => {
        setInFlight(false);
        setMotions(new Map());
        setGhostArrow(null);
        timerRef.current = null;
      }, motion.durationMs);
    },
    [enabled],
  );

  return { inFlight, motions, ghostArrow, enabled, setEnabled, run };
}
