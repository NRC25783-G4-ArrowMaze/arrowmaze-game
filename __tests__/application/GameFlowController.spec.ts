import { GameFlowController } from '../../src/application/services/GameFlowController';
import { InvalidFlowTransitionError } from '../../src/application/errors/GameFlowErrors';
import { GameSession } from '../../src/domain/entities/GameSession';
import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function buildBoardWithCells(occupied: number, free: number): Board {
  const board = new Board('test-board');
  let idx = 0;

  for (let i = 0; i < occupied; i++) {
    const cell = new Cell(`cell-occ-${idx++}`, 2);
    cell.placeArrowSegment({ isHead: false, cellId: `arrow-${i}` });
    board.addCell(cell);
  }

  for (let i = 0; i < free; i++) {
    const cell = new Cell(`cell-free-${idx++}`, 2);
    board.addCell(cell);
  }

  return board;
}

/** Sesión ya transicionada a WON (tablero vacío). */
function buildWonSession(): GameSession {
  const session = new GameSession(5);
  session.evaluateStatus(buildBoardWithCells(0, 1));
  return session;
}

/** Sesión ya transicionada a LOST (tablero ocupado, sin movimientos). */
function buildLostSession(): GameSession {
  const session = new GameSession(1);
  session.consumeMove();
  session.evaluateStatus(buildBoardWithCells(1, 0));
  return session;
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe('GameFlowController — estado inicial', () => {
  it('se inicializa con stack = [ACTIVE]', () => {
    const controller = new GameFlowController(new GameSession(5));
    expect(controller.stack).toEqual(['ACTIVE']);
    expect(controller.current).toBe('ACTIVE');
  });
});

describe('GameFlowController — pause()', () => {
  it('desde ACTIVE con session IN_PROGRESS: apila PAUSED', () => {
    const controller = new GameFlowController(new GameSession(4));
    controller.pause();
    expect(controller.stack).toEqual(['ACTIVE', 'PAUSED']);
    expect(controller.current).toBe('PAUSED');
  });

  it('la GameSession no se muta (movesRemaining, status, score intactos)', () => {
    const session = new GameSession(4);
    const controller = new GameFlowController(session);
    controller.pause();
    expect(session.movesRemaining).toBe(4);
    expect(session.status).toBe('IN_PROGRESS');
    expect(session.score).toBeNull();
  });

  it('lanza InvalidFlowTransitionError si session.status es WON', () => {
    const controller = new GameFlowController(buildWonSession());
    expect(() => controller.pause()).toThrow(InvalidFlowTransitionError);
    expect(controller.stack).toEqual(['ACTIVE']);
  });

  it('lanza InvalidFlowTransitionError si session.status es LOST', () => {
    const controller = new GameFlowController(buildLostSession());
    expect(() => controller.pause()).toThrow(InvalidFlowTransitionError);
    expect(controller.stack).toEqual(['ACTIVE']);
  });

  it('lanza InvalidFlowTransitionError si el tope ya es PAUSED', () => {
    const controller = new GameFlowController(new GameSession(4));
    controller.pause();
    expect(() => controller.pause()).toThrow(InvalidFlowTransitionError);
    expect(controller.stack).toEqual(['ACTIVE', 'PAUSED']);
  });

  it('lanza InvalidFlowTransitionError si el tope es SETTINGS', () => {
    const controller = new GameFlowController(new GameSession(4));
    controller.pause();
    controller.openSettings();
    expect(() => controller.pause()).toThrow(InvalidFlowTransitionError);
    expect(controller.stack).toEqual(['ACTIVE', 'PAUSED', 'SETTINGS']);
  });
});

describe('GameFlowController — resume()', () => {
  it('desde [ACTIVE, PAUSED]: desapila, vuelve a [ACTIVE]', () => {
    const controller = new GameFlowController(new GameSession(4));
    controller.pause();
    controller.resume();
    expect(controller.stack).toEqual(['ACTIVE']);
    expect(controller.current).toBe('ACTIVE');
  });

  it('la GameSession sigue igual tras resume', () => {
    const session = new GameSession(4);
    const controller = new GameFlowController(session);
    controller.pause();
    controller.resume();
    expect(controller.session).toBe(session);
    expect(session.movesRemaining).toBe(4);
    expect(session.status).toBe('IN_PROGRESS');
  });

  it('lanza InvalidFlowTransitionError si el tope no es PAUSED', () => {
    const controller = new GameFlowController(new GameSession(4));
    expect(() => controller.resume()).toThrow(InvalidFlowTransitionError);
    expect(controller.stack).toEqual(['ACTIVE']);
  });
});

describe('GameFlowController — openSettings() / closeSettings()', () => {
  it('openSettings desde [ACTIVE, PAUSED]: apila SETTINGS', () => {
    const controller = new GameFlowController(new GameSession(4));
    controller.pause();
    controller.openSettings();
    expect(controller.stack).toEqual(['ACTIVE', 'PAUSED', 'SETTINGS']);
  });

  it('openSettings lanza InvalidFlowTransitionError si el tope no es PAUSED', () => {
    const controller = new GameFlowController(new GameSession(4));
    expect(() => controller.openSettings()).toThrow(InvalidFlowTransitionError);
    expect(controller.stack).toEqual(['ACTIVE']);
  });

  it('closeSettings desde [ACTIVE, PAUSED, SETTINGS]: vuelve a [ACTIVE, PAUSED], no a [ACTIVE]', () => {
    const controller = new GameFlowController(new GameSession(4));
    controller.pause();
    controller.openSettings();
    controller.closeSettings();
    expect(controller.stack).toEqual(['ACTIVE', 'PAUSED']);
    expect(controller.current).toBe('PAUSED');
  });

  it('closeSettings lanza InvalidFlowTransitionError si el tope no es SETTINGS', () => {
    const controller = new GameFlowController(new GameSession(4));
    controller.pause();
    expect(() => controller.closeSettings()).toThrow(InvalidFlowTransitionError);
    expect(controller.stack).toEqual(['ACTIVE', 'PAUSED']);
  });
});

describe('GameFlowController — restart()', () => {
  it('desde [ACTIVE, PAUSED]: reemplaza la session y colapsa a [ACTIVE]', () => {
    const oldSession = new GameSession(1);
    oldSession.consumeMove();
    const controller = new GameFlowController(oldSession);
    controller.pause();

    const newSession = new GameSession(5);
    controller.restart(newSession);

    expect(controller.session).toBe(newSession);
    expect(controller.session).not.toBe(oldSession);
    expect(controller.stack).toEqual(['ACTIVE']);
  });

  it('la nueva session tiene movesRemaining fresco y score = null', () => {
    const controller = new GameFlowController(new GameSession(5));
    controller.pause();
    controller.restart(new GameSession(5));
    expect(controller.session.movesRemaining).toBe(5);
    expect(controller.session.status).toBe('IN_PROGRESS');
    expect(controller.session.score).toBeNull();
  });

  it('lanza InvalidFlowTransitionError si el tope no es PAUSED', () => {
    const controller = new GameFlowController(new GameSession(5));
    expect(() => controller.restart(new GameSession(5))).toThrow(
      InvalidFlowTransitionError,
    );
    expect(controller.stack).toEqual(['ACTIVE']);
  });
});

describe('GameFlowController — invariante de Dominio', () => {
  it('GameSession.status jamás observa PAUSED ni SETTINGS tras cualquier secuencia de flujo', () => {
    const session = new GameSession(4);
    const controller = new GameFlowController(session);
    const observed: string[] = [session.status];

    controller.pause();
    observed.push(controller.session.status);
    controller.openSettings();
    observed.push(controller.session.status);
    controller.closeSettings();
    observed.push(controller.session.status);
    controller.resume();
    observed.push(controller.session.status);
    controller.pause();
    controller.restart(new GameSession(4));
    observed.push(controller.session.status);

    for (const status of observed) {
      expect(['IN_PROGRESS', 'WON', 'LOST']).toContain(status);
    }
  });
});
