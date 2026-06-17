import { GameSession } from '../../src/domain/entities/GameSession';
import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function buildEmptyBoard(): Board {
  const board = new Board('test-board');
  const cell = new Cell('free-1', 2);
  board.addCell(cell);
  return board;
}

function buildOccupiedBoard(): Board {
  const board = new Board('occupied-board');
  const cell = new Cell('occ-1', 2);
  cell.placeArrowSegment({ isHead: false, cellId: 'occ-1' });
  board.addCell(cell);
  return board;
}

function pumpTicks(session: GameSession, count: number, success: boolean): void {
  for (let i = 0; i < count; i++) {
    session.recordMoveOutcome(success);
  }
}

// ══════════════════════════════════════════════
// GRUPO 1 — TIEMPO + BONUS FLAWLESS
// ══════════════════════════════════════════════

describe('GameSession — scoring: Grupo 1 — tiempo + flawless', () => {
  it('victoria sin fallas con ticksUsed=100: score.finalScore = 1300', () => {
    const session = new GameSession(200);
    pumpTicks(session, 100, true);
    session.evaluateStatus(buildEmptyBoard());

    expect(session.score).not.toBeNull();
    expect(session.score?.timeScore).toBe(800);
    expect(session.score?.flawlessVictory).toBe(true);
    expect(session.score?.finalScore).toBe(1300);
  });

  it('timeScore clamped: ticksUsed=600, 0 fails → score.finalScore = 500', () => {
    const session = new GameSession(1000);
    pumpTicks(session, 600, true);
    session.evaluateStatus(buildEmptyBoard());

    expect(session.score?.timeScore).toBe(0);
    expect(session.score?.flawlessVictory).toBe(true);
    expect(session.score?.finalScore).toBe(500);
  });
});

// ══════════════════════════════════════════════
// GRUPO 2 — PENALIZACIÓN POR FALLAS
// ══════════════════════════════════════════════

describe('GameSession — scoring: Grupo 2 — penalización por fallas', () => {
  it('1 falla aislada: flawlessVictory=false, score.finalScore = 790', () => {
    const session = new GameSession(200);
    session.recordMoveOutcome(false); // fail (streak=1, penalty=10)
    pumpTicks(session, 99, true);    // remaining 99 success ticks
    session.evaluateStatus(buildEmptyBoard());

    expect(session.score?.flawlessVictory).toBe(false);
    expect(session.score?.penaltyTotal).toBe(10);
    expect(session.score?.finalScore).toBe(790);
  });

  it('3 fallas no consecutivas (racha=1 cada una): score.finalScore = 770', () => {
    const session = new GameSession(200);
    // falla-éxito-falla-éxito-falla (3 rachas de 1)
    session.recordMoveOutcome(false); // streak 1 → +10
    session.recordMoveOutcome(true);  // reset
    session.recordMoveOutcome(false); // streak 1 → +10
    session.recordMoveOutcome(true);  // reset
    session.recordMoveOutcome(false); // streak 1 → +10
    pumpTicks(session, 95, true);
    session.evaluateStatus(buildEmptyBoard());

    expect(session.score?.flawlessVictory).toBe(false);
    expect(session.score?.penaltyTotal).toBe(30);
    expect(session.score?.finalScore).toBe(770);
  });

  it('3 fallas consecutivas: score.finalScore = 740', () => {
    const session = new GameSession(200);
    session.recordMoveOutcome(false); // streak 1 → +10
    session.recordMoveOutcome(false); // streak 2 → +20
    session.recordMoveOutcome(false); // streak 3 → +30
    pumpTicks(session, 97, true);
    session.evaluateStatus(buildEmptyBoard());

    expect(session.score?.penaltyTotal).toBe(60);
    expect(session.score?.finalScore).toBe(740);
  });

  it('éxito intermedio resetea racha: falla-falla-éxito-falla-falla → score.finalScore = 740', () => {
    const session = new GameSession(200);
    session.recordMoveOutcome(false); // streak 1 → +10
    session.recordMoveOutcome(false); // streak 2 → +20
    session.recordMoveOutcome(true);  // reset
    session.recordMoveOutcome(false); // streak 1 → +10
    session.recordMoveOutcome(false); // streak 2 → +20
    pumpTicks(session, 95, true);
    session.evaluateStatus(buildEmptyBoard());

    expect(session.score?.penaltyTotal).toBe(60);
    expect(session.score?.finalScore).toBe(740);
  });

  it('20 fallas consecutivas: score.finalScore clamped a 0', () => {
    const session = new GameSession(200);
    pumpTicks(session, 20, false); // racha de 20 → penalty = 10×(1+…+20) = 2100
    pumpTicks(session, 80, true);
    session.evaluateStatus(buildEmptyBoard());

    expect(session.score?.finalScore).toBe(0);
  });
});

// ══════════════════════════════════════════════
// GRUPO 3 — ESTADOS TERMINALES Y VISIBILIDAD
// ══════════════════════════════════════════════

describe('GameSession — scoring: Grupo 3 — estados terminales', () => {
  it('LOST → score = null', () => {
    const session = new GameSession(1);
    session.consumeMove();
    session.evaluateStatus(buildOccupiedBoard()); // LOST
    expect(session.status).toBe('LOST');
    expect(session.score).toBeNull();
  });

  it('IN_PROGRESS → score = null', () => {
    const session = new GameSession(5);
    session.evaluateStatus(buildOccupiedBoard()); // IN_PROGRESS
    expect(session.status).toBe('IN_PROGRESS');
    expect(session.score).toBeNull();
  });

  it('consultar score en LOST no expone contadores internos (score es null)', () => {
    const session = new GameSession(1);
    pumpTicks(session, 1, false);
    session.consumeMove();
    session.evaluateStatus(buildOccupiedBoard());
    // score=null implica ausencia de victoria; los contadores internos no son accesibles
    expect(session.score).toBeNull();
  });

  it('consultar score en IN_PROGRESS no expone contadores internos (score es null)', () => {
    const session = new GameSession(10);
    pumpTicks(session, 3, false);
    session.evaluateStatus(buildOccupiedBoard()); // still IN_PROGRESS
    expect(session.score).toBeNull();
  });
});

// ══════════════════════════════════════════════
// GRUPO 4 — COMPONENTES EXPLÍCITAMENTE DESCARTADOS
// Nota: GameSession no modela arrowsEvacuated ni usa movesRemaining en el score.
// Estos tests confirman que dichas variables no influyen en finalScore.
// Son nominales a nivel de GameSession (el aggregate no las representa).
// ══════════════════════════════════════════════

describe('GameSession — scoring: Grupo 4 — componentes descartados', () => {
  it('arrowsEvacuated no afecta el score: dos sesiones con mismo ticksUsed/fails producen mismo score', () => {
    // GameSession no rastrrea arrowsEvacuated. Ambas sesiones con ticksUsed=100 y 0 fails
    // producen score=1300 independientemente de cuántas flechas se "evacuaron".
    const session1 = new GameSession(200);
    const session2 = new GameSession(200);

    pumpTicks(session1, 100, true);
    pumpTicks(session2, 100, true);

    session1.evaluateStatus(buildEmptyBoard());
    session2.evaluateStatus(buildEmptyBoard());

    expect(session1.score?.finalScore).toBe(1300);
    expect(session2.score?.finalScore).toBe(1300);
    expect(session1.score?.finalScore).toBe(session2.score?.finalScore);
  });

  it('movesRemaining no afecta el score: dos sesiones con distinto movesRemaining producen mismo score', () => {
    // session1: allowedMoves=20, usa 5 → 15 remaining al ganar
    // session2: allowedMoves=20, usa 15 → 5 remaining al ganar
    const session1 = new GameSession(20);
    const session2 = new GameSession(20);

    // Consumir distintos movimientos antes de los ticks de scoring
    for (let i = 0; i < 5; i++) session1.consumeMove();
    for (let i = 0; i < 15; i++) session2.consumeMove();

    pumpTicks(session1, 100, true);
    pumpTicks(session2, 100, true);

    session1.evaluateStatus(buildEmptyBoard());
    session2.evaluateStatus(buildEmptyBoard());

    expect(session1.movesRemaining).toBe(15);
    expect(session2.movesRemaining).toBe(5);
    expect(session1.score?.finalScore).toBe(1300);
    expect(session2.score?.finalScore).toBe(1300);
  });
});

// ══════════════════════════════════════════════
// GRUPO 5 — VALIDACIÓN PARAMÉTRICA
// ══════════════════════════════════════════════

describe('GameSession — scoring: Grupo 5 — validación paramétrica', () => {
  // ticksUsed = 100 en todos los casos (100 - fallas success + fallas consecutive fails)
  it.each([
    { fallas: 1,  penalizacion: 10,   score: 790  },
    { fallas: 2,  penalizacion: 30,   score: 770  },
    { fallas: 3,  penalizacion: 60,   score: 740  },
    { fallas: 4,  penalizacion: 100,  score: 700  },
    { fallas: 5,  penalizacion: 150,  score: 650  },
    { fallas: 6,  penalizacion: 210,  score: 590  },
    { fallas: 10, penalizacion: 550,  score: 250  },
    { fallas: 12, penalizacion: 780,  score: 20   },
    { fallas: 13, penalizacion: 910,  score: 0    },
    { fallas: 20, penalizacion: 2100, score: 0    },
  ])(
    'racha de $fallas fallas consecutivas → penalización=$penalizacion, score=$score',
    ({ fallas, penalizacion, score }) => {
      const session = new GameSession(500);
      pumpTicks(session, 100 - fallas, true);
      pumpTicks(session, fallas, false); // racha consecutiva
      session.evaluateStatus(buildEmptyBoard());

      expect(session.score?.penaltyTotal).toBe(penalizacion);
      expect(session.score?.finalScore).toBe(score);
    }
  );
});
