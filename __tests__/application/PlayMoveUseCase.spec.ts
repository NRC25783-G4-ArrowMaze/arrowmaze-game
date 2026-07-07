import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { Arrow } from '../../src/domain/entities/Arrow';
import { GameSession } from '../../src/domain/entities/GameSession';
import { AdvanceArrowUseCase } from '../../src/application/use-cases/AdvanceArrowUseCase';
import { PlayMoveUseCase } from '../../src/application/use-cases/PlayMoveUseCase';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function buildLinearBoard(): { board: Board; A: Cell; B: Cell; C: Cell } {
  const board = new Board('board');
  const A = new Cell('A', 4);
  const B = new Cell('B', 4);
  const C = new Cell('C', 4);
  [A, B, C].forEach(c => board.addCell(c));
  board.connectPorts(A, 2, B, 0);
  board.connectPorts(B, 2, C, 0);
  return { board, A, B, C };
}

function makeUseCase(): PlayMoveUseCase {
  return new PlayMoveUseCase(new AdvanceArrowUseCase());
}

// ══════════════════════════════════════════════
// BLOQUE 1 — CONSUMO ATÓMICO DEL PRESUPUESTO
// ══════════════════════════════════════════════

describe('PlayMoveUseCase — consumo atómico', () => {
  it('Scenario Outline [advanced]: ejecución exitosa decrementa 1 movimiento', () => {
    const { board, A } = buildLinearBoard();
    const arrow = new Arrow(A, 2); // A[2]→B (B free)
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('advanced');
    expect(result.movesRemaining).toBe(4);
    expect(session.movesRemaining).toBe(4);
  });

  it('Scenario Outline [blocked]: ejecución bloqueada decrementa 1 movimiento', () => {
    const { board, A, B } = buildLinearBoard();
    const arrow = new Arrow(A, 2); // A[2]→B
    const blocker = new Arrow(B, 2); // occupies B
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('blocked');
    expect(result.movesRemaining).toBe(4);
    expect(session.movesRemaining).toBe(4);

    void blocker;
  });

  it('Scenario Outline [destroyed]: destrucción decrementa 1 movimiento', () => {
    const { board, A } = buildLinearBoard();
    expect(A.isExit(0)).toBe(true);
    const arrow = new Arrow(A, 0); // port 0 is exit → destroyed
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('destroyed');
    expect(result.movesRemaining).toBe(4);
    expect(session.movesRemaining).toBe(4);
  });

  it('Fallo de pre-condición (advanceResult.success=false) NO consume movimiento', () => {
    // Build board A-B-C-D
    const board = new Board('corrupt-board');
    const A = new Cell('A', 4);
    const B = new Cell('B', 4);
    const C = new Cell('C', 4);
    const D = new Cell('D', 4);
    [A, B, C, D].forEach(c => board.addCell(c));
    board.connectPorts(A, 2, B, 0);
    board.connectPorts(B, 2, C, 0);
    board.connectPorts(C, 2, D, 0);

    // 3-segment arrow: head@A, body@B, body@C
    const arrow = new Arrow(A, 2);
    arrow.extend(B);
    arrow.extend(C);

    // Corrupt chain: B[2] ↔ C[0] was how body B found C.
    // After disconnect, _calculateTargets throws ArrowCinematicError.
    board.disconnectPort(B, 2);

    const session = new GameSession(7);
    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(false);
    expect(result.movesRemaining).toBe(7);
    expect(session.movesRemaining).toBe(7);
    expect(result.gameStatus).toBe('IN_PROGRESS');
  });
});

// ══════════════════════════════════════════════
// BLOQUE 2 — DETECCIÓN DE VICTORIA
// ══════════════════════════════════════════════

describe('PlayMoveUseCase — detección de victoria', () => {
  it('última flecha sale del tablero: gameStatus transiciona a WON', () => {
    const board = new Board('win-board');
    const A = new Cell('A', 4);
    board.addCell(A);
    const arrow = new Arrow(A, 0); // A[0] is exit → destroyed
    const session = new GameSession(4);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('destroyed');
    expect(result.gameStatus).toBe('WON');
    expect(result.movesRemaining).toBe(3);
    expect(session.status).toBe('WON');
  });

  it('tablero vacío + movesRemaining llega a 0: gameStatus = WON (precedencia WON > LOST)', () => {
    const board = new Board('last-move-board');
    const A = new Cell('A', 4);
    board.addCell(A);
    const arrow = new Arrow(A, 0); // A[0] is exit → destroyed
    const session = new GameSession(1);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.movesRemaining).toBe(0);
    expect(result.gameStatus).toBe('WON');
    expect(session.status).toBe('WON');
  });

  it('evacuación parcial (2 de 3 flechas): gameStatus permanece IN_PROGRESS', () => {
    const board = new Board('partial-board');
    const A = new Cell('A', 4);
    const B = new Cell('B', 4);
    const C = new Cell('C', 4);
    [A, B, C].forEach(c => board.addCell(c));

    const f1 = new Arrow(A, 0); // A[0] is exit → will be destroyed
    const f2 = new Arrow(B, 0); // remains
    const f3 = new Arrow(C, 0); // remains
    const session = new GameSession(8);

    const result = makeUseCase().execute({ session, board, arrow: f1 });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('destroyed');
    expect(result.gameStatus).toBe('IN_PROGRESS');
    expect(result.movesRemaining).toBe(7);
    expect(B.hasArrowSegment()).toBe(true);
    expect(C.hasArrowSegment()).toBe(true);

    void f2; void f3;
  });
});

// ══════════════════════════════════════════════
// BLOQUE 3 — DETECCIÓN DE DERROTA
// ══════════════════════════════════════════════

describe('PlayMoveUseCase — detección de derrota', () => {
  it('movesRemaining llega a 0 con tablero ocupado: gameStatus transiciona a LOST', () => {
    const { board, A } = buildLinearBoard();
    const arrow = new Arrow(A, 2); // advances A→B
    const session = new GameSession(1);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(true);
    expect(result.movesRemaining).toBe(0);
    expect(result.gameStatus).toBe('LOST');
    expect(session.status).toBe('LOST');
  });

  it('bloqueo persistente: tick 1 → IN_PROGRESS, tick 2 → LOST', () => {
    const { board, A, B } = buildLinearBoard();
    const f1 = new Arrow(A, 2); // A[2]→B, blocked by f2
    const f2 = new Arrow(B, 2);
    const session = new GameSession(2);
    const useCase = makeUseCase();

    const result1 = useCase.execute({ session, board, arrow: f1 });
    expect(result1.success).toBe(true);
    expect(result1.outcome).toBe('blocked');
    expect(result1.movesRemaining).toBe(1);
    expect(result1.gameStatus).toBe('IN_PROGRESS');

    const result2 = useCase.execute({ session, board, arrow: f1 });
    expect(result2.success).toBe(true);
    expect(result2.outcome).toBe('blocked');
    expect(result2.movesRemaining).toBe(0);
    expect(result2.gameStatus).toBe('LOST');

    void f2;
  });
});

// ══════════════════════════════════════════════
// BLOQUE 4 — INVARIANTES Y TERMINALIDAD
// ══════════════════════════════════════════════

describe('PlayMoveUseCase — terminalidad', () => {
  it('sesión WON: retorna success=false con error "Game already WON", no invoca AdvanceArrowUseCase', () => {
    const { board, A } = buildLinearBoard();

    // Set session to WON using an empty board (0 cells → vacuously all free)
    const session = new GameSession(5);
    const emptyBoard = new Board('empty');
    session.evaluateStatus(emptyBoard);
    expect(session.status).toBe('WON');

    // Arrow that would advance if use case reached AdvanceArrowUseCase
    const arrow = new Arrow(A, 2);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Game already WON');
    expect(result.gameStatus).toBe('WON');
    // Board and arrow NOT mutated — guard fired before AdvanceArrowUseCase
    expect(A.hasArrowSegment()).toBe(true);
    expect(arrow.head.cell).toBe(A);
  });

  it('sesión LOST: retorna success=false con error "Game already LOST", no invoca AdvanceArrowUseCase', () => {
    const { board, A, B } = buildLinearBoard();

    // Pre-set session to LOST: movesRemaining=0 with occupied board
    const session = new GameSession(0);
    const f2 = new Arrow(B, 2); // occupies B
    session.evaluateStatus(board); // movesRemaining=0, B occupied → LOST
    expect(session.status).toBe('LOST');

    const f1 = new Arrow(A, 2); // would advance if use case reached AdvanceArrowUseCase
    const result = makeUseCase().execute({ session, board, arrow: f1 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Game already LOST');
    expect(result.gameStatus).toBe('LOST');
    // Arrow and board NOT mutated
    expect(A.hasArrowSegment()).toBe(true);
    expect(f1.head.cell).toBe(A);

    void f2;
  });
});
