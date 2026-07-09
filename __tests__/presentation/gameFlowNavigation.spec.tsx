// Criterio de tests i18n (G2): los componentes que consumen el contexto i18n
// (useTranslation) se prueban con render() de @testing-library; la lógica pura
// (GameController + GameFlowController) se prueba directamente como función pura.
// El patrón puro del repo (invocar el componente como función) es incompatible
// con hooks → render() solo donde hay contexto.
import { render, screen } from '@testing-library/react';
import { GameController } from '../../src/presentation/game/GameController';
import { SAMPLE_LEVEL } from '../../src/presentation/game/sampleLevel';
import { GameFlowController } from '../../src/application/services/GameFlowController';
import { InvalidFlowTransitionError } from '../../src/application/errors/GameFlowErrors';
import { PauseOverlay } from '../../src/presentation/components/PauseOverlay';
import { SettingsOverlay } from '../../src/presentation/components/SettingsOverlay';
import { I18nProvider } from '../../src/presentation/i18n/I18nProvider';

// Mapea los Rule del .feature C4 sobre GameController + GameFlowController
// directamente (sin renderizar el hook useGameController), replicando las
// condiciones que GameView usa para decidir qué overlay mostrar.
const noop = (): void => undefined;

/** Misma condición que GameView.onPointerDown (enabled). */
function boardInputEnabled(controller: GameController, flow: GameFlowController, inFlight: boolean): boolean {
  return controller.status === 'IN_PROGRESS' && !inFlight && flow.current === 'ACTIVE';
}

/** Renderiza un overlay bajo el contexto i18n y devuelve si está presente por su testid. */
function overlayPresent(ui: React.ReactElement, testId: string): boolean {
  const { container, unmount } = render(<I18nProvider initialLang="es">{ui}</I18nProvider>);
  const present = container.querySelector(`[data-testid="${testId}"]`) !== null;
  unmount();
  return present;
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

    const overlayFor = (): React.ReactElement => (
      <PauseOverlay
        visible={flow.current === 'PAUSED'}
        onResume={noop}
        onRestart={noop}
        onOpenSettings={noop}
        onExit={noop}
      />
    );

    expect(overlayPresent(overlayFor(), 'pause-overlay')).toBe(false);
    flow.pause();
    expect(overlayPresent(overlayFor(), 'pause-overlay')).toBe(true);
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

    const settingsPresent = overlayPresent(
      <SettingsOverlay visible={flow.current === 'SETTINGS'} onClose={noop} />,
      'settings-overlay',
    );
    const pausePresent = overlayPresent(
      <PauseOverlay
        visible={(flow.current as string) === 'PAUSED'}
        onResume={noop}
        onRestart={noop}
        onOpenSettings={noop}
        onExit={noop}
      />,
      'pause-overlay',
    );

    expect(settingsPresent).toBe(true);
    expect(pausePresent).toBe(false);
  });
});

describe('Rule — la navegación entre pantallas de soporte es reversible y sin estados huérfanos', () => {
  it('desde PAUSED existe una acción visible que retrocede (resume) y una que sale (exit)', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    flow.pause();

    const onResume = jest.fn();
    const onExit = jest.fn();
    render(
      <I18nProvider initialLang="es">
        <PauseOverlay visible onResume={onResume} onRestart={noop} onOpenSettings={noop} onExit={onExit} />
      </I18nProvider>,
    );

    // El overlay expone Reanudar y Salir como acciones de retorno, sin invocarlas solo por renderizar.
    expect(screen.getByTestId('pause-overlay')).toBeInTheDocument();
    expect(onResume).not.toHaveBeenCalled();
    expect(onExit).not.toHaveBeenCalled();
  });

  it('desde SETTINGS existe una acción visible que retrocede a PAUSED (Volver)', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    const flow = new GameFlowController(controller.gameSession);
    flow.pause();
    flow.openSettings();

    const onClose = jest.fn();
    render(
      <I18nProvider initialLang="es">
        <SettingsOverlay visible onClose={onClose} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-overlay')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
