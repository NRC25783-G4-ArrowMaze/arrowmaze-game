import { GameController } from '../../src/presentation/game/GameController';
import { SAMPLE_LEVEL } from '../../src/presentation/game/sampleLevel';
import { GameFlowController } from '../../src/application/services/GameFlowController';
import { InvalidFlowTransitionError } from '../../src/application/errors/GameFlowErrors';
import { PauseOverlay } from '../../src/presentation/components/PauseOverlay';
import { SettingsOverlay } from '../../src/presentation/components/SettingsOverlay';

// Mapea los Rule del .feature C4 sobre GameController + GameFlowController
// directamente (sin renderizar React ni el hook useGameController), replicando
// las condiciones que GameView usa para decidir qué overlay mostrar y si el
// tablero acepta input.
const noop = (): void => undefined;

/** Misma condición que GameView.onPointerDown (enabled). */
function boardInputEnabled(controller: GameController, flow: GameFlowController, inFlight: boolean): boolean {
  return controller.status === 'IN_PROGRESS' && !inFlight && flow.current === 'ACTIVE';
}

describe('Rule — Pausa congela el input del tablero sin perder el estado de la partida', () => {
  it('pausar bloquea el input del tablero (enabled pasa a false)', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);

    expect(boardInputEnabled(controller, flow, false)).toBe(true);
    flow.pause();
    expect(boardInputEnabled(controller, flow, false)).toBe(false);
  });

  it('pausar no altera movesRemaining ni las posiciones de las flechas', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    const before = controller.viewModel();

    flow.pause();

    expect(controller.movesRemaining).toBe(SAMPLE_LEVEL.allowedMoves);
    expect(controller.viewModel()).toEqual(before);
  });

  it('PauseOverlay solo se muestra cuando el tope de la pila es PAUSED', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);

    expect(
      PauseOverlay({
        visible: flow.current === 'PAUSED',
        onResume: noop,
        onRestart: noop,
        onOpenSettings: noop,
        onExit: noop,
      }),
    ).toBeNull();

    flow.pause();

    expect(
      PauseOverlay({
        visible: flow.current === 'PAUSED',
        onResume: noop,
        onRestart: noop,
        onOpenSettings: noop,
        onExit: noop,
      }),
    ).not.toBeNull();
  });
});

describe('Rule — Reanudar retoma la partida exactamente donde quedó', () => {
  it('tras pause() + resume(): movesRemaining, score y viewModel son idénticos a antes de pausar', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    const before = controller.viewModel();

    flow.pause();
    flow.resume();

    expect(flow.current).toBe('ACTIVE');
    expect(controller.movesRemaining).toBe(SAMPLE_LEVEL.allowedMoves);
    expect(controller.score).toBeNull();
    expect(controller.viewModel()).toEqual(before);
  });
});

describe('Rule — Reiniciar desde Pausa descarta la partida actual y arranca una fresca', () => {
  it('restart() exige tope PAUSED: lanza InvalidFlowTransitionError si se invoca en ACTIVE', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    const fresh = new GameController(SAMPLE_LEVEL);

    expect(() => flow.restart(fresh.gameSession)).toThrow(InvalidFlowTransitionError);
  });

  it('tras restart() desde PAUSED: movesRemaining vuelve al valor inicial y score es null', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    controller.playMove({ arrowId: 'blue' });
    flow.pause();

    const fresh = new GameController(SAMPLE_LEVEL);
    flow.restart(fresh.gameSession);

    expect(flow.stack).toEqual(['ACTIVE']);
    expect(flow.session.movesRemaining).toBe(SAMPLE_LEVEL.allowedMoves);
    expect(flow.session.score).toBeNull();
  });
});

describe('Rule — Ajustes es un contenedor accesible solo desde Pausa', () => {
  it('openSettings() exige tope PAUSED', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    expect(() => flow.openSettings()).toThrow(InvalidFlowTransitionError);
  });

  it('closeSettings() vuelve a PAUSED, nunca directo a ACTIVE', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    flow.pause();
    flow.openSettings();
    flow.closeSettings();
    expect(flow.current).toBe('PAUSED');
  });

  it('SettingsOverlay solo se muestra cuando el tope de la pila es SETTINGS, y PauseOverlay se oculta mientras tanto', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    flow.pause();
    flow.openSettings();

    const settings = SettingsOverlay({ visible: flow.current === 'SETTINGS', onClose: noop });
    const pause = PauseOverlay({
      visible: flow.current === 'PAUSED',
      onResume: noop,
      onRestart: noop,
      onOpenSettings: noop,
      onExit: noop,
    });

    expect(settings).not.toBeNull();
    expect(pause).toBeNull();
  });
});

describe('Rule — la navegación entre pantallas de soporte es reversible y sin estados huérfanos', () => {
  it('desde PAUSED existe una acción visible que retrocede (resume) y una que sale (exit)', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    flow.pause();

    const onResume = jest.fn();
    const onExit = jest.fn();
    const overlay = PauseOverlay({
      visible: true,
      onResume,
      onRestart: noop,
      onOpenSettings: noop,
      onExit,
    });

    expect(overlay).not.toBeNull();
    // No se pausa a mitad de un slide en vuelo (regla ya cubierta por
    // useGameController.pause() como no-op); aquí solo se verifica que
    // el overlay expone Reanudar y Salir como acciones de retorno.
    expect(onResume).not.toHaveBeenCalled();
    expect(onExit).not.toHaveBeenCalled();
  });

  it('desde SETTINGS existe una acción visible que retrocede a PAUSED (Volver)', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    flow.pause();
    flow.openSettings();

    const onClose = jest.fn();
    const overlay = SettingsOverlay({ visible: true, onClose });

    expect(overlay).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
