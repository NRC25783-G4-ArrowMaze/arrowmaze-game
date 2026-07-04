import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { Arrow } from '../../src/domain/entities/Arrow';
import { GameSession } from '../../src/domain/entities/GameSession';
import { AdvanceArrowUseCase } from '../../src/application/use-cases/AdvanceArrowUseCase';
import { SlideArrowUseCase } from '../../src/application/use-cases/SlideArrowUseCase';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function buildLinearBoard(): { board: Board; A: Cell; B: Cell; C: Cell } {
  const board = new Board('board');
  const A = new Cell('A', 4);
  const B = new Cell('B', 4);
  const C = new Cell('C', 4);
  [A, B, C].forEach(c => board.addCell(c));
  board.connectPorts(A, 2, B, 0); // A[2] → B[0]
  board.connectPorts(B, 2, C, 0); // B[2] → C[0]; C[2] queda exit
  return { board, A, B, C };
}

function makeUseCase(): SlideArrowUseCase {
  return new SlideArrowUseCase(new AdvanceArrowUseCase());
}

// ══════════════════════════════════════════════
// BLOQUE 1 — DESLIZAR HASTA SALIR
// ══════════════════════════════════════════════

describe('SlideArrowUseCase — deslizar hasta salir', () => {
  it('encadena ticks hasta el sumidero y termina en destroyed', () => {
    const { board, A } = buildLinearBoard();
    const arrow = new Arrow(A, 2); // A→B→C→exit(port 2)
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(true);
    expect(result.finalOutcome).toBe('destroyed');
    expect(board.getAllCells().every(c => !c.hasArrowSegment())).toBe(true);
  });

  it('expone la trayectoria de ticks en orden', () => {
    const { board, A } = buildLinearBoard();
    const arrow = new Arrow(A, 2);
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.trajectory).toEqual(['advanced', 'advanced', 'destroyed']);
  });
});

// ══════════════════════════════════════════════
// BLOQUE 2 — DESLIZAR HASTA CHOCAR (CABEZA)
// ══════════════════════════════════════════════

describe('SlideArrowUseCase — deslizar hasta chocar (cabeza)', () => {
  it('se detiene en blocked al topar una flecha ajena', () => {
    const { board, A, C } = buildLinearBoard();
    const arrow = new Arrow(A, 2);   // avanzaría A→B→C
    const blocker = new Arrow(C, 2); // ocupa C
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(true);
    expect(result.finalOutcome).toBe('blocked');
    expect(result.trajectory).toEqual(['advanced', 'blocked']); // A→B, luego B→C bloqueado
    expect(arrow.head.cell).toBe(board.getCell('B'));            // quedó en B
    void blocker;
  });

  it('bloqueo inmediato: blocked en el primer tick sin desplazamiento', () => {
    const { board, A, B } = buildLinearBoard();
    const arrow = new Arrow(A, 2);
    const blocker = new Arrow(B, 2); // B ocupada
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.finalOutcome).toBe('blocked');
    expect(result.trajectory).toEqual(['blocked']);
    expect(arrow.head.cell).toBe(A); // nunca se movió
    void blocker;
  });
});

// ══════════════════════════════════════════════
// BLOQUE 3 — SESIÓN Y PRESUPUESTO
// ══════════════════════════════════════════════

describe('SlideArrowUseCase — sesión y presupuesto', () => {
  it('un slide consume exactamente 1 movimiento (no 1 por tick)', () => {
    const { board, A } = buildLinearBoard();
    const arrow = new Arrow(A, 2); // 3 ticks hasta salir
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.trajectory.length).toBe(3); // 3 ticks internos
    expect(result.movesRemaining).toBe(4);    // pero 1 solo movimiento consumido
    expect(session.movesRemaining).toBe(4);
  });

  it('evaluateStatus una vez; vaciar el tablero → WON con score', () => {
    const { board, A } = buildLinearBoard();
    const arrow = new Arrow(A, 2); // sale → tablero vacío
    const session = new GameSession(5);

    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.gameStatus).toBe('WON');
    expect(session.status).toBe('WON');
    expect(typeof result.score).toBe('number');
  });

  it('fallo de infra (advance.success=false) no consume movimiento', () => {
    const board = new Board('corrupt');
    const A = new Cell('A', 4);
    const B = new Cell('B', 4);
    const C = new Cell('C', 4);
    [A, B, C].forEach(c => board.addCell(c));
    board.connectPorts(A, 2, B, 0);
    board.connectPorts(B, 2, C, 0);

    const arrow = new Arrow(A, 2);
    arrow.extend(B);
    arrow.extend(C);
    board.disconnectPort(B, 2); // corrompe la cadena → ArrowCinematicError

    const session = new GameSession(7);
    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(false);
    expect(result.movesRemaining).toBe(7);
    expect(session.movesRemaining).toBe(7);
    expect(result.gameStatus).toBe('IN_PROGRESS');
  });
});

// ══════════════════════════════════════════════
// BLOQUE 4 — TERMINALIDAD
// ══════════════════════════════════════════════

describe('SlideArrowUseCase — terminalidad', () => {
  it('sesión WON: rechaza el slide sin ejecutar advance()', () => {
    const { board, A } = buildLinearBoard();
    const session = new GameSession(5);
    session.evaluateStatus(new Board('empty')); // tablero vacío → WON
    expect(session.status).toBe('WON');

    const arrow = new Arrow(A, 2);
    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Game already WON');
    expect(result.trajectory).toEqual([]);
    expect(arrow.head.cell).toBe(A); // no se movió
  });

  it('sesión LOST: rechaza el slide sin ejecutar advance()', () => {
    const { board, A, B } = buildLinearBoard();
    const session = new GameSession(0);
    const blocker = new Arrow(B, 2);
    session.evaluateStatus(board); // movesRemaining 0 + ocupado → LOST
    expect(session.status).toBe('LOST');

    const arrow = new Arrow(A, 2);
    const result = makeUseCase().execute({ session, board, arrow });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Game already LOST');
    expect(arrow.head.cell).toBe(A);
    void blocker;
  });
});
