import { GameSession } from '../../src/domain/entities/GameSession';
import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { NoMovesRemainingError } from '../../src/domain/errors/GameErrors';

// ─────────────────────────────────────────────
// HELPER
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

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe('GameSession — constructor', () => {
  it('inicializa con movesRemaining = N y status = IN_PROGRESS', () => {
    const session = new GameSession(5);
    expect(session.movesRemaining).toBe(5);
    expect(session.status).toBe('IN_PROGRESS');
  });

  it('lanza Error si movesRemaining es negativo', () => {
    expect(() => new GameSession(-1)).toThrow('GameSession: movesRemaining must be >= 0');
  });
});

describe('GameSession — consumeMove()', () => {
  it('decrementa movesRemaining en exactamente 1', () => {
    const session = new GameSession(5);
    session.consumeMove();
    expect(session.movesRemaining).toBe(4);
  });

  it('lanza NoMovesRemainingError si movesRemaining === 0', () => {
    const session = new GameSession(0);
    expect(() => session.consumeMove()).toThrow(NoMovesRemainingError);
    expect(() => session.consumeMove()).toThrow('NoMovesRemainingError: no moves remaining in this session');
  });

  it('invariante: movesRemaining nunca queda en negativo', () => {
    const session = new GameSession(1);
    session.consumeMove();
    expect(session.movesRemaining).toBe(0);
    expect(() => session.consumeMove()).toThrow(NoMovesRemainingError);
    expect(session.movesRemaining).toBe(0);
  });
});

describe('GameSession — evaluateStatus(board)', () => {
  it('retorna WON cuando todas las celdas tienen hasArrowSegment()===false', () => {
    const session = new GameSession(3);
    const board = buildBoardWithCells(0, 2);
    expect(session.evaluateStatus(board)).toBe('WON');
    expect(session.status).toBe('WON');
  });

  it('retorna LOST cuando movesRemaining===0 y al menos 1 celda ocupada', () => {
    const session = new GameSession(1);
    session.consumeMove();
    const board = buildBoardWithCells(1, 1);
    expect(session.evaluateStatus(board)).toBe('LOST');
    expect(session.status).toBe('LOST');
  });

  it('retorna IN_PROGRESS cuando hay celdas ocupadas y movesRemaining > 0', () => {
    const session = new GameSession(3);
    const board = buildBoardWithCells(1, 1);
    expect(session.evaluateStatus(board)).toBe('IN_PROGRESS');
    expect(session.status).toBe('IN_PROGRESS');
  });

  it('WON tiene precedencia sobre LOST: tablero vacío + movesRemaining=0 → WON', () => {
    const session = new GameSession(1);
    session.consumeMove();
    expect(session.movesRemaining).toBe(0);
    const board = buildBoardWithCells(0, 2);
    expect(session.evaluateStatus(board)).toBe('WON');
    expect(session.status).toBe('WON');
  });

  it('es idempotente: status WON no cambia con evaluateStatus repetido', () => {
    const session = new GameSession(3);
    const emptyBoard = buildBoardWithCells(0, 2);
    session.evaluateStatus(emptyBoard);
    expect(session.status).toBe('WON');

    const occupiedBoard = buildBoardWithCells(2, 0);
    session.evaluateStatus(occupiedBoard);
    expect(session.status).toBe('WON');
  });

  it('es idempotente: status LOST no cambia con evaluateStatus repetido', () => {
    const session = new GameSession(1);
    session.consumeMove();
    const board = buildBoardWithCells(1, 0);
    session.evaluateStatus(board);
    expect(session.status).toBe('LOST');

    const emptyBoard = buildBoardWithCells(0, 2);
    session.evaluateStatus(emptyBoard);
    expect(session.status).toBe('LOST');
  });

  it('status terminal (WON) no regresa a IN_PROGRESS con tablero ocupado', () => {
    const session = new GameSession(5);
    const emptyBoard = buildBoardWithCells(0, 1);
    session.evaluateStatus(emptyBoard);
    expect(session.status).toBe('WON');

    const occupiedBoard = buildBoardWithCells(2, 0);
    const result = session.evaluateStatus(occupiedBoard);
    expect(result).toBe('WON');
    expect(session.status).toBe('WON');
  });
});
