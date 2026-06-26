import { useCallback, useMemo, useState } from 'react';
import { GameController } from './GameController';
import type { Scene } from './scene';
import type { GameStatus } from '../../domain/entities/GameSession';
import type { PlayMoveResult } from '../../application/dtos/SessionDTOs';
import type { BoardViewModel } from '../viewModel';
import type { PlayMoveCommand } from '../input/PlayMoveCommand';

/** Estado y acciones del juego expuestos a la capa de React. */
export interface GameControllerState {
  /** Instancia estable del controlador (para consultas como resolveArrowIdAt). */
  controller: GameController;
  /** View-model proyectado del estado actual (se recalcula tras cada tick). */
  viewModel: BoardViewModel;
  status: GameStatus;
  movesRemaining: number;
  score: number | null;
  /** True mientras una animación de tick está en vuelo (Fase 3). Bloquea input. */
  inFlight: boolean;
  /** Marca/limpia el flag de vuelo (lo usa la capa de animación). */
  setInFlight: (value: boolean) => void;
  /** Ejecuta un tick vía el motor y re-renderiza con el nuevo estado. */
  playMove: (command: PlayMoveCommand) => PlayMoveResult | null;
}

/**
 * useGameController — Puente entre React y el GameController.
 *
 * Crea el controlador una sola vez (la escena es fija) y fuerza re-render tras
 * cada tick incrementando un contador de versión; el view-model y los datos de
 * sesión se derivan de esa versión. La mutación de estado vive en el dominio:
 * aquí solo se reproyecta lo que el motor ya cambió.
 */
export function useGameController(scene: Scene): GameControllerState {
  // Instancia estable del controlador: el inicializador de useState corre una vez.
  // Se sostiene en estado (no en ref) para poder leerla durante el render.
  const [controller] = useState(() => new GameController(scene));

  // Cada tick bumpea la versión → recalcula las proyecciones derivadas.
  const [version, setVersion] = useState(0);
  const [inFlight, setInFlight] = useState(false);

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
    (command: PlayMoveCommand): PlayMoveResult | null => {
      const result = controller.playMove(command);
      setVersion((v) => v + 1);
      return result;
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
    setInFlight,
    playMove,
  };
}
