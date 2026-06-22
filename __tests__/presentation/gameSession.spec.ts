import { GameController } from '../../src/presentation/game/GameController';
import { SAMPLE_LEVEL } from '../../src/presentation/game/sampleLevel';
import { decideTap } from '../../src/presentation/input/tapResolver';
import { computeBoardLayout, cellCenter } from '../../src/presentation/rendering/boardLayout';

const SIZE = 420;

describe('B4 — fin de juego y bloqueo terminal', () => {
  it('destruir todas las flechas lleva la sesión a WON con puntaje', () => {
    const c = new GameController(SAMPLE_LEVEL);

    // Azul (4,2)+(4,1) hacia el N: 3 ticks hasta destruirse en el borde.
    c.playMove({ arrowId: 'blue' });
    c.playMove({ arrowId: 'blue' });
    c.playMove({ arrowId: 'blue' });

    // Naranja avanza una vez al S → libera (2,2) para que verde pase.
    c.playMove({ arrowId: 'orange' });

    // Verde (1,2) al E: avanza (2,2)→(3,2)→(4,2)→(5,2) y se destruye (5 ticks).
    for (let i = 0; i < 5; i++) c.playMove({ arrowId: 'green' });

    // Naranja: 3 ticks más hasta destruirse en el borde inferior.
    c.playMove({ arrowId: 'orange' });
    c.playMove({ arrowId: 'orange' });
    c.playMove({ arrowId: 'orange' });

    expect(c.status).toBe('WON');
    expect(c.viewModel().arrows).toHaveLength(0);
    expect(c.score).not.toBeNull();
  });

  it('agotar los movimientos con flechas vivas lleva a LOST', () => {
    const c = new GameController(SAMPLE_LEVEL);

    // Verde está bloqueada por naranja: cada toque consume un movimiento sin avanzar.
    for (let i = 0; i < SAMPLE_LEVEL.allowedMoves; i++) {
      c.playMove({ arrowId: 'green' });
    }

    expect(c.movesRemaining).toBe(0);
    expect(c.status).toBe('LOST');
  });

  it('en estado terminal el motor rechaza nuevos ticks', () => {
    const c = new GameController(SAMPLE_LEVEL);
    for (let i = 0; i < SAMPLE_LEVEL.allowedMoves; i++) {
      c.playMove({ arrowId: 'green' });
    }
    expect(c.status).toBe('LOST');

    const result = c.playMove({ arrowId: 'blue' });
    expect(result?.success).toBe(false);
    expect(result?.gameStatus).toBe('LOST');
  });

  it('en estado terminal la capa de input no emite comando (enabled=false)', () => {
    const c = new GameController(SAMPLE_LEVEL);
    const layout = computeBoardLayout(SAMPLE_LEVEL.cells, SIZE, SIZE);
    const onHead = cellCenter(4, 2, layout.cellSize, layout.offset);
    // Simula el gating de App: en terminal, enabled = false.
    const command = decideTap(
      false,
      { button: 0, isPrimary: true },
      onHead,
      layout,
      (col, row) => c.resolveArrowIdAt(col, row),
    );
    expect(command).toBeNull();
  });
});
