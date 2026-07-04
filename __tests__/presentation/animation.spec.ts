import {
  buildArrowMotion,
  GLIDE_MS,
  RECOIL_MS,
  FADE_MS,
  RECOIL_FRACTION,
} from '../../src/presentation/animation/motion';
import { GameController } from '../../src/presentation/game/GameController';
import { SAMPLE_LEVEL } from '../../src/presentation/game/sampleLevel';

const CELL = 70;

describe('B2 — plan de movimiento por outcome', () => {
  it('advanced → glide de UNA celda completa en dirección del exitPort', () => {
    // exitPort 0 = Norte → (0, -1)
    expect(buildArrowMotion('advanced', 0, CELL)).toEqual({
      kind: 'glide',
      dx: 0,
      dy: -CELL,
      durationMs: GLIDE_MS,
    });
    // exitPort 1 = Este → (+1, 0)
    expect(buildArrowMotion('advanced', 1, CELL)).toEqual({
      kind: 'glide',
      dx: CELL,
      dy: 0,
      durationMs: GLIDE_MS,
    });
  });

  it('blocked → recoil de una fracción de celda hacia el exitPort', () => {
    // exitPort 2 = Sur → (0, +1)
    expect(buildArrowMotion('blocked', 2, CELL)).toEqual({
      kind: 'recoil',
      dx: 0,
      dy: CELL * RECOIL_FRACTION,
      durationMs: RECOIL_MS,
    });
  });

  it('destroyed → fade con deriva de una celda en dirección del exitPort', () => {
    // exitPort 3 = Oeste → (-1, 0)
    expect(buildArrowMotion('destroyed', 3, CELL)).toEqual({
      kind: 'fade',
      dx: -CELL,
      dy: 0,
      durationMs: FADE_MS,
    });
  });
});

describe('B2 — determinismo: la animación no altera el estado del motor', () => {
  it('construir el plan de animación NO muta el controlador/dominio', () => {
    const controller = new GameController(SAMPLE_LEVEL);
    controller.playMove({ arrowId: 'blue' }); // un tick real
    const snapshot = JSON.stringify(controller.viewModel());

    // Construir planes para los tres outcomes no debe tocar el estado.
    buildArrowMotion('advanced', 0, CELL);
    buildArrowMotion('blocked', 1, CELL);
    buildArrowMotion('destroyed', 2, CELL);

    expect(JSON.stringify(controller.viewModel())).toBe(snapshot);
    expect(controller.movesRemaining).toBe(SAMPLE_LEVEL.allowedMoves - 1);
  });

  it('la secuencia de ticks produce el mismo estado final con o sin animación', () => {
    // El estado final solo depende del motor (playMove); las animaciones son
    // visuales. Dos corridas idénticas de ticks deben coincidir exactamente.
    const run = (): string => {
      const c = new GameController(SAMPLE_LEVEL);
      c.playMove({ arrowId: 'blue' }); // advanced
      c.playMove({ arrowId: 'green' }); // blocked
      c.playMove({ arrowId: 'orange' }); // advanced
      c.playMove({ arrowId: 'blue' }); // advanced (hacia el borde)
      return JSON.stringify({
        vm: c.viewModel(),
        moves: c.movesRemaining,
        status: c.status,
      });
    };
    expect(run()).toBe(run());
  });
});
