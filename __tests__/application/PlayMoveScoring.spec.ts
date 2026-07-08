import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { Arrow } from '../../src/domain/entities/Arrow';
import { GameSession } from '../../src/domain/entities/GameSession';
import { AdvanceArrowUseCase } from '../../src/application/use-cases/AdvanceArrowUseCase';
import { PlayMoveUseCase } from '../../src/application/use-cases/PlayMoveUseCase';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function makeUseCase(): PlayMoveUseCase {
  return new PlayMoveUseCase(new AdvanceArrowUseCase());
}

/**
 * 1-cell board: A[0]=exit (all ports unconnected).
 * Arrow at A[0] → destroyed in 1 tick.
 */
function buildOneCellBoard(): { board: Board; A: Cell } {
  const board = new Board('one-cell');
  const A = new Cell('A', 4);
  board.addCell(A);
  return { board, A };
}

/**
 * 2-cell board: A[2]→B[0]. B[2]=exit.
 * Arrow at A[2] → advances to B (tick 1), then B[2] exit → destroyed (tick 2).
 */
function buildTwoCellBoard(): { board: Board; A: Cell; B: Cell } {
  const board = new Board('two-cell');
  const A = new Cell('A', 4);
  const B = new Cell('B', 4);
  board.addCell(A);
  board.addCell(B);
  board.connectPorts(A, 2, B, 0);
  return { board, A, B };
}

/**
 * 3-cell linear board: A[2]→B[0], B[2]→C[0]. C[2]=exit.
 * Arrow at A[2] → advances A→B (tick 1), B→C (tick 2), C[2] exit → destroyed (tick 3).
 */
function buildLinearBoard(): { board: Board; A: Cell; B: Cell; C: Cell } {
  const board = new Board('linear');
  const A = new Cell('A', 4);
  const B = new Cell('B', 4);
  const C = new Cell('C', 4);
  [A, B, C].forEach(c => board.addCell(c));
  board.connectPorts(A, 2, B, 0);
  board.connectPorts(B, 2, C, 0);
  return { board, A, B, C };
}

// ══════════════════════════════════════════════
// BLOQUE 1 — SCORE EN PlayMoveResult
// ══════════════════════════════════════════════

describe('PlayMoveUseCase — scoring: score en PlayMoveResult', () => {
  it('victoria flawless 1 tick (destroyed): score = 1498', () => {
    // ticksUsed=1, totalFails=0 → timeScore=998, +500 flawless = 1498
    // B-1 addendum: valor corregido (plan original tenía 1300, incorrecto para 1 tick)
    const { board, A } = buildOneCellBoard();
    const arrow = new Arrow(A, 0); // A[0]=exit → destroyed → WON
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.gameStatus).toBe('WON');
    expect(result.score).toBe(1498);
  });

  it('victoria con fallas: 4 ticks, 1 blocked → score = 982', () => {
    // Secuencia: f1 blocked (fail) → f2 destroyed → f1 advanced → f1 destroyed (WON)
    // ticksUsed=4, totalFails=1, penalty=10, no flawless → timeScore=992, finalScore=982
    const { board, A, B } = buildTwoCellBoard();
    const f1 = new Arrow(A, 2); // A[2]→B; bloqueado si B ocupado
    const f2 = new Arrow(B, 1); // B[1]=exit → destroyed en 1 tick
    const session = new GameSession(10);
    const uc = makeUseCase();

    uc.execute({ session, board, arrow: f1 }); // blocked (f2 at B)
    uc.execute({ session, board, arrow: f2 }); // f2 destroyed (B freed)
    uc.execute({ session, board, arrow: f1 }); // f1 advances A→B
    const result = uc.execute({ session, board, arrow: f1 }); // f1 exits B → WON

    expect(result.gameStatus).toBe('WON');
    expect(result.score).toBe(982);

    void f2;
  });

  it('IN_PROGRESS: PlayMoveResult.score es undefined', () => {
    const { board, A } = buildTwoCellBoard();
    const f1 = new Arrow(A, 2); // avanza A→B; B queda ocupado → IN_PROGRESS
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow: f1 });

    expect(result.gameStatus).toBe('IN_PROGRESS');
    expect(result.score).toBeUndefined();
  });

  it('LOST: PlayMoveResult.score es undefined', () => {
    const { board, A, B } = buildTwoCellBoard();
    const f1 = new Arrow(A, 2); // intenta avanzar a B
    const f2 = new Arrow(B, 1); // ocupa B → bloquea a f1
    const session = new GameSession(1); // solo 1 movimiento

    const result = makeUseCase().execute({ session, board, arrow: f1 });
    // blocked → consumeMove → 0 moves. B ocupado por f2 → LOST

    expect(result.gameStatus).toBe('LOST');
    expect(result.score).toBeUndefined();

    void f2;
  });
});

// ══════════════════════════════════════════════
// BLOQUE 2 — REGISTRO DE OUTCOMES (B-2 addendum)
// Tests reescritos para asertar sobre finalScore observable.
// La mecánica de contadores está cubierta en ScoringTracker.spec.ts y
// GameSessionScoring.spec.ts. Aquí verificamos el wiring con PlayMoveUseCase.
// ══════════════════════════════════════════════

describe('PlayMoveUseCase — scoring: registro de outcomes', () => {
  it('outcome=blocked registra falla: score=982 confirma penalty=10 aplicada', () => {
    // Sin el registro de la falla, score sería 1492 (4 ticks flawless).
    // Con penalty=10 y sin flawless: 992−10=982.
    const { board, A, B } = buildTwoCellBoard();
    const f1 = new Arrow(A, 2);
    const f2 = new Arrow(B, 1);
    const session = new GameSession(10);
    const uc = makeUseCase();

    uc.execute({ session, board, arrow: f1 }); // blocked
    uc.execute({ session, board, arrow: f2 }); // f2 destroyed
    uc.execute({ session, board, arrow: f1 }); // advanced
    const result = uc.execute({ session, board, arrow: f1 }); // destroyed → WON

    expect(result.score).toBe(982);

    void f2;
  });

  it('outcome=advanced registra éxito: 2-tick advance+destroy produce score flawless 1496', () => {
    // Si advance fuera registrado como falla: ticksUsed=2, totalFails=1, penalty=10 → 986 (no flawless).
    // Correcto: ticksUsed=2, totalFails=0, flawless → timeScore=996, finalScore=1496.
    const { board, A } = buildTwoCellBoard();
    const f1 = new Arrow(A, 2); // tick 1: advance A→B, tick 2: B[2] exit → WON
    const session = new GameSession(5);
    const uc = makeUseCase();

    uc.execute({ session, board, arrow: f1 }); // advanced
    const result = uc.execute({ session, board, arrow: f1 }); // destroyed → WON

    expect(result.gameStatus).toBe('WON');
    expect(result.score).toBe(1496);
  });

  it('outcome=destroyed registra éxito: 3-tick advance+advance+destroy produce score flawless 1494', () => {
    // Si destroyed fuera registrado como falla: ticksUsed=3, totalFails=1, penalty=10 → 984 (no flawless).
    // Correcto: ticksUsed=3, totalFails=0, flawless → timeScore=994, finalScore=1494.
    const { board, A } = buildLinearBoard();
    const f1 = new Arrow(A, 2); // A→B→C→destroyed (3 ticks)
    const session = new GameSession(5);
    const uc = makeUseCase();

    uc.execute({ session, board, arrow: f1 }); // advanced A→B
    uc.execute({ session, board, arrow: f1 }); // advanced B→C
    const result = uc.execute({ session, board, arrow: f1 }); // C[2] exit → destroyed → WON

    expect(result.gameStatus).toBe('WON');
    expect(result.score).toBe(1494);
  });

  it('fallo de infra no registra outcome: score=1498 tras infra-failure + 1 tick win', () => {
    // Si el fallo de infra fuera registrado como falla: ticksUsed=2, totalFails=1 → score≠1498.
    // Si fuera registrado como éxito: ticksUsed=2, flawless → 1492≠1498.
    // Correcto (no registrado): ticksUsed=1, flawless → 1498.
    const session = new GameSession(10);
    const uc = makeUseCase();

    // — Construir tablero corrupto idéntico al test existente de infra failure —
    const corruptBoard = new Board('corrupt');
    const CA = new Cell('CA', 4);
    const CB = new Cell('CB', 4);
    const CC = new Cell('CC', 4);
    const CD = new Cell('CD', 4);
    [CA, CB, CC, CD].forEach(c => corruptBoard.addCell(c));
    corruptBoard.connectPorts(CA, 2, CB, 0);
    corruptBoard.connectPorts(CB, 2, CC, 0);
    corruptBoard.connectPorts(CC, 2, CD, 0);

    const corruptArrow = new Arrow(CA, 2);
    corruptArrow.extend(CB);
    corruptArrow.extend(CC);
    corruptBoard.disconnectPort(CB, 2); // rompe la cadena → ArrowCinematicError

    const failResult = uc.execute({ session, board: corruptBoard, arrow: corruptArrow });
    expect(failResult.success).toBe(false); // confirma fallo de infra

    // — Win limpia en 1 tick —
    const { board: cleanBoard, A: cleanA } = buildOneCellBoard();
    const winArrow = new Arrow(cleanA, 0); // A[0]=exit → destroyed → WON
    const winResult = uc.execute({ session, board: cleanBoard, arrow: winArrow });

    expect(winResult.gameStatus).toBe('WON');
    expect(winResult.score).toBe(1498); // solo 1 tick real, 0 fallas
  });
});
