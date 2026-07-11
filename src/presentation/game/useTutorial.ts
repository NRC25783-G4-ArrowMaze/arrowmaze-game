import { useCallback, useEffect, useState } from 'react';
import type { Scene } from './scene';
import { TUTORIAL_LEVEL_ID, TUTORIAL_STEPS } from './tutorial/tutorialScript';
import type { ITutorialPreference } from '../../application/ports/ITutorialPreference';
import { CapacitorTutorialPreference } from '../../infrastructure/tutorial/CapacitorTutorialPreference';

/** Retardo antes de que la manito aparezca sobre la flecha del paso actual. */
const HINT_DELAY_MS = 1000;

/** Instancia por defecto (inyectable en tests). */
const defaultPreference: ITutorialPreference = new CapacitorTutorialPreference();

export interface TutorialHintCell {
  col: number;
  row: number;
}

/** "col,row" → {col,row}; null si el id no es parseable. */
function parseCell(cellId: string): TutorialHintCell | null {
  const parts = cellId.split(',').map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  return { col: parts[0], row: parts[1] };
}

/**
 * useTutorial — guía animada del primer nivel (`level-initial`), SOLO la primera vez.
 *
 * Recorre `TUTORIAL_STEPS` en orden: tras ~1s de estar activo el paso, expone la
 * celda-cabeza de su flecha en `hintCell` para que el tablero dibuje la manito.
 * `notifyMove` avanza el paso cuando se juega la flecha correcta; al terminar la
 * secuencia marca el tutorial como completado (persistente) y deja de guiar.
 *
 * @param active — el tablero está aceptando toques (IN_PROGRESS, ACTIVE, sin slide
 *   en vuelo); mientras es falso la manito se oculta.
 */
export function useTutorial(
  scene: Scene,
  active: boolean,
  preference: ITutorialPreference = defaultPreference,
): { hintCell: TutorialHintCell | null; notifyMove: (arrowId: string) => void } {
  const isTutorialLevel = scene.id === TUTORIAL_LEVEL_ID;

  // completed=true por defecto: mantiene la guía oculta hasta que la persistencia
  // confirme que NO se ha visto (evita un parpadeo de la manito al arrancar).
  const [completed, setCompleted] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  // Paso para el que la manito ya "maduró" (pasó el retardo). null = aún ninguno.
  const [visibleStep, setVisibleStep] = useState<number | null>(null);

  useEffect(() => {
    if (!isTutorialLevel) return;
    let mounted = true;
    preference
      .isCompleted()
      .then((done) => { if (mounted) setCompleted(done); })
      .catch(() => { /* isCompleted ya cae a "visto" ante error */ });
    return () => { mounted = false; };
  }, [isTutorialLevel, preference]);

  const guiding = isTutorialLevel && !completed && stepIndex < TUTORIAL_STEPS.length;

  // La manito madura ~1s después de (re)activarse el paso actual. Solo se hace
  // setState de forma asíncrona (dentro del timeout); la visibilidad efectiva se
  // deriva más abajo, así se oculta sin cascadas cuando el tablero deja de
  // aceptar toques (pausa, slide en vuelo, victoria).
  useEffect(() => {
    if (!guiding || !active) return;
    const id = window.setTimeout(() => setVisibleStep(stepIndex), HINT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [guiding, active, stepIndex]);

  const handVisible = guiding && active && visibleStep === stepIndex;

  const notifyMove = useCallback(
    (arrowId: string) => {
      if (!isTutorialLevel || completed) return;
      if (arrowId !== TUTORIAL_STEPS[stepIndex]) return; // flecha equivocada: se sigue guiando
      const next = stepIndex + 1;
      setStepIndex(next);
      if (next >= TUTORIAL_STEPS.length) {
        setCompleted(true);
        preference.markCompleted().catch((e: unknown) =>
          console.error('[useTutorial] No se pudo guardar el estado del tutorial:', e),
        );
      }
    },
    [isTutorialLevel, completed, stepIndex, preference],
  );

  let hintCell: TutorialHintCell | null = null;
  if (guiding && handVisible) {
    const arrow = scene.arrows.find((a) => a.id === TUTORIAL_STEPS[stepIndex]);
    if (arrow !== undefined) hintCell = parseCell(arrow.head.cellId);
  }

  return { hintCell, notifyMove };
}
