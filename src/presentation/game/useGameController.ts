import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameController } from './GameController';
import type { Scene } from './scene';
import type { GameStatus } from '../../domain/entities/GameSession';
import type { BoardViewModel } from '../viewModel';
import type { PlayMoveCommand } from '../input/PlayMoveCommand';

/** Milisegundos entre ticks del slide animado (frame a frame, un poco rápido). */
const TICK_MS = 90;

/** Duración del estallido de desaparición (ms). Espeja BURST_MS de ArrowBurst. */
const BURST_MS = 350;

/**
 * Señal de colisión para la capa de render: identifica la última flecha que
 * quedó bloqueada y un nonce que cambia en cada choque (re-dispara el rebote
 * aunque sea la misma flecha dos veces seguidas).
 */
export interface CollisionSignal {
  arrowId: string;
  nonce: number;
}

/**
 * Señal de desaparición para la capa de render: la última flecha que se destruyó
 * (salió del tablero / llegó al objetivo) en su última posición visible. El board
 * la usa para estallar chispas en la celda-cabeza (cellIds[0]). El nonce cambia en
 * cada desaparición para re-disparar el estallido aunque se repita.
 */
export interface VanishSignal {
  color: string;
  cellIds: string[];
  nonce: number;
}

/**
 * Señal de desintegración de la punta para la capa de render: la cabeza de la
 * flecha que se está destruyendo, justo ANTES del estallido de chispas. Se renderiza
 * como un triángulo que se quiebra/erosiona. Dura ~150ms; visualmente precede al burst.
 */
export interface HeadDisintegratingSignal {
  color: string;
  cellId: string; // posición de la cabeza
  exitDir: number; // dirección del apex
  nonce: number;
}

/** Estado y acciones del juego expuestos a la capa de React. */
export interface GameControllerState {
  /** Instancia estable del controlador (para consultas como resolveArrowIdAt). */
  controller: GameController;
  /** View-model proyectado del estado actual (se recalcula tras cada tick). */
  viewModel: BoardViewModel;
  status: GameStatus;
  movesRemaining: number;
  score: number | null;
  /** True mientras un slide está en curso (anima tick-a-tick). Bloquea input. */
  inFlight: boolean;
  /** Última colisión (flecha bloqueada) para animar el rebote. Null si no hubo. */
  collision: CollisionSignal | null;
  /** Última desaparición (flecha destruida) para estallar chispas. Null si no hubo. */
  vanishing: VanishSignal | null;
  /** Cabeza desintegrándose justo antes del burst. Null si no hay. */
  headDisintegrating: HeadDisintegratingSignal | null;
  /** Inicia un slide: avanza la flecha tick-a-tick hasta colisión o salida. */
  playMove: (command: PlayMoveCommand) => void;
}

/**
 * useGameController — Puente entre React y el GameController.
 *
 * Crea el controlador una sola vez (la escena es fija) y fuerza re-render tras
 * cada tick incrementando un contador de versión; el view-model y los datos de
 * sesión se derivan de esa versión.
 *
 * El slide se anima SIMULANDO CLICKS: en vez de saltar al estado final, se
 * encadena `advanceTick` con una pausa (TICK_MS) entre pasos, reproyectando la
 * forma REAL del dominio en cada tick. Así una flecha curva ajusta su cuerpo
 * paso a paso (no es un translate rígido). Al detenerse (blocked/destroyed) se
 * consolida la jugada una sola vez con `commitSlide`.
 */
export function useGameController(scene: Scene): GameControllerState {
  // Instancia estable del controlador: el inicializador de useState corre una vez.
  // Se sostiene en estado (no en ref) para poder leerla durante el render.
  const [controller] = useState(() => new GameController(scene));

  // Cada tick bumpea la versión → recalcula las proyecciones derivadas.
  const [version, setVersion] = useState(0);
  const [inFlight, setInFlight] = useState(false);
  const [collision, setCollision] = useState<CollisionSignal | null>(null);
  const [vanishing, setVanishing] = useState<VanishSignal | null>(null);
  const [headDisintegrating, setHeadDisintegrating] =
    useState<HeadDisintegratingSignal | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collisionNonce = useRef(0);
  const vanishNonce = useRef(0);
  const vanishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headDisintegratingNonce = useRef(0);
  const headDisintegratingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia cualquier temporizador pendiente al desmontar.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      if (vanishTimerRef.current !== null) {
        clearTimeout(vanishTimerRef.current);
      }
      if (headDisintegratingTimerRef.current !== null) {
        clearTimeout(headDisintegratingTimerRef.current);
      }
    };
  }, []);

  const viewModel = useMemo(
    () => controller.viewModel(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controller, version],
  );
  const status = useMemo(
    () => controller.status,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controller, version],
  );
  const movesRemaining = useMemo(
    () => controller.movesRemaining,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controller, version],
  );
  const score = useMemo(
    () => controller.score,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controller, version],
  );

  const playMove = useCallback(
    (command: PlayMoveCommand): void => {
      if (controller.status !== 'IN_PROGRESS') {
        return;
      }
      setInFlight(true);

      const step = (): void => {
        // Snapshot de la última forma visible ANTES del tick: si este tick destruye
        // la flecha, su cabeza (cellIds[0]) marca dónde estallan las chispas.
        const before = controller
          .viewModel()
          .arrows.find((a) => a.id === command.arrowId);

        const outcome = controller.advanceTick(command.arrowId);
        setVersion((v) => v + 1); // reproyecta la forma real de este tick

        if (outcome === 'advanced') {
          timerRef.current = setTimeout(step, TICK_MS);
          return;
        }

        // Terminal (blocked/destroyed) o null: el slide termina.
        if (outcome !== null) {
          controller.commitSlide(outcome);
          setVersion((v) => v + 1);
          if (outcome === 'blocked') {
            // Choque: dispara el rebote de ESTA flecha (nonce siempre nuevo).
            collisionNonce.current += 1;
            setCollision({ arrowId: command.arrowId, nonce: collisionNonce.current });
          } else if (
            outcome === 'destroyed' &&
            before !== undefined &&
            before.cellIds.length > 0
          ) {
            // Desaparición: desintegración de la punta (150ms) seguida de estallido de chispas (350ms).
            // DESINTEGRACIÓN: cabeza se quiebra/erosiona.
            headDisintegratingNonce.current += 1;
            const headNonce = headDisintegratingNonce.current;
            setHeadDisintegrating({
              color: before.color,
              cellId: before.cellIds[0],
              exitDir: before.exitDir,
              nonce: headNonce,
            });
            headDisintegratingTimerRef.current = setTimeout(() => {
              setHeadDisintegrating((s) => (s?.nonce === headNonce ? null : s));
            }, 150); // DISINTEGRATE_MS espejo
            // ESTALLIDO: chispas tras la desintegración.
            vanishNonce.current += 1;
            const vanishNonce_val = vanishNonce.current;
            setVanishing({ color: before.color, cellIds: before.cellIds, nonce: vanishNonce_val });
            vanishTimerRef.current = setTimeout(() => {
              setVanishing((s) => (s?.nonce === vanishNonce_val ? null : s));
            }, BURST_MS);
          }
        }
        timerRef.current = null;
        setInFlight(false);
      };

      step();
    },
    [controller],
  );

  return {
    controller,
    viewModel,
    status,
    movesRemaining,
    score,
    inFlight,
    collision,
    vanishing,
    headDisintegrating,
    playMove,
  };
}
