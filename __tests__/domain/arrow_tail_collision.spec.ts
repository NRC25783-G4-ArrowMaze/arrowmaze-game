/**
 * Arrow Tail Collision Test Suite (FIX-2)
 *
 * Covers features/tail-collision-detection.feature.
 *
 * Gap closed: advance() validated only the HEAD's target (phase 3). In a multi-cell
 * arrow the head's target is its own body (self, released by the drag) → never blocks.
 * The only segment entering NEW territory is the TAIL (the leading edge), and its
 * target was not validated → Cell.placeArrowSegment overwrote silently. FIX-2 adds a
 * tail-target check (phase 3.5): a foreign-occupied tail target → 'blocked' (rollback).
 *
 * Convención de puertos: 0=N, 1=E, 2=S, 3=O; opuesto = (puerto + 2) mod 4.
 *
 * Cinemática de `new Arrow(A, 2); extend(B)` sobre el tablero lineal:
 *   - head en A, exitPort 2 → A[2] = B  (destino = self, el cuerpo)
 *   - cola en B, entryPort 0 → exitDir (0+2)%4 = 2 → B[2] = C  (frente, celda nueva)
 */

import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { Arrow } from '../../src/domain/entities/Arrow';

// ─────────────────────────────────────────────
// HELPERS — small 4-port boards
// ─────────────────────────────────────────────

/**
 * Linear board A → B → C:
 *   A[2] ↔ B[0]
 *   B[2] ↔ C[0]
 *   C[2] = exit (sink)
 * `withSideD` adds a foreign off-route cell D: B[1] ↔ D[3].
 */
function buildLinearBoard(withSideD = false): {
  board: Board;
  A: Cell; B: Cell; C: Cell; D: Cell | null;
} {
  const board = new Board('tail-linear-board');
  const A = new Cell('A', 4);
  const B = new Cell('B', 4);
  const C = new Cell('C', 4);
  [A, B, C].forEach(c => board.addCell(c));

  board.connectPorts(A, 2, B, 0);
  board.connectPorts(B, 2, C, 0);

  let D: Cell | null = null;
  if (withSideD) {
    D = new Cell('D', 4);
    board.addCell(D);
    board.connectPorts(B, 1, D, 3); // off-route side branch
  }

  return { board, A, B, C, D };
}

/**
 * Tail-to-sink board A → B → exit:
 *   A[2] ↔ B[0]
 *   B[2] = exit (sink)
 */
function buildSinkBoard(): { board: Board; A: Cell; B: Cell } {
  const board = new Board('tail-sink-board');
  const A = new Cell('A', 4);
  const B = new Cell('B', 4);
  [A, B].forEach(c => board.addCell(c));

  board.connectPorts(A, 2, B, 0);
  // B[2] remains an exit

  return { board, A, B };
}

/**
 * Loop board (two-cell ring):
 *   A[2] ↔ B[0]   (head A exits via port2 → B)
 *   A[0] ↔ B[2]   (tail B exits via port2 → A = self)
 */
function buildLoopBoard(): { board: Board; A: Cell; B: Cell } {
  const board = new Board('tail-loop-board');
  const A = new Cell('A', 4);
  const B = new Cell('B', 4);
  [A, B].forEach(c => board.addCell(c));

  board.connectPorts(A, 2, B, 0);
  board.connectPorts(A, 0, B, 2);

  return { board, A, B };
}

// ══════════════════════════════════════════════
// BLOQUE 1 — COLISIÓN EN LA COLA (EL FIX)
// ══════════════════════════════════════════════

describe('Arrow.advance — colisión en la cola', () => {

  test('bloquea cuando la cola avanza a celda ocupada por flecha ajena', () => {
    const { A, B, C } = buildLinearBoard();

    // F1 = [head A (exit 2 → B = self), tail B (→ C)]
    const f1 = new Arrow(A, 2);
    f1.extend(B);

    // F2 ocupa C (entidad ajena, destino de la cola de F1)
    const f2 = new Arrow(C, 2);
    expect(C.isOccupied()).toBe(true);

    const result = f1.advance();

    // El frente (cola) topa con F2 → blocked + rollback (nada mutado)
    expect(result.outcome).toBe('blocked');
    expect(result.freedCellIds).toHaveLength(0);
    expect(result.occupiedCellIds).toHaveLength(0);
    // C (ocupada por F2) permanece intacta
    expect(C.isOccupied()).toBe(true);
    expect(C.getArrowSegment()).not.toBeNull();

    void f2;
  });

  test('rollback: cadena, longitud y contenedores intactos tras blocked', () => {
    const { A, B, C } = buildLinearBoard();

    const f1 = new Arrow(A, 2);
    f1.extend(B);
    const blocker = new Arrow(C, 2);

    const headBefore = f1.head;
    const tailBefore = f1.head.next!;

    const result = f1.advance();
    expect(result.outcome).toBe('blocked');

    // Punteros internos intactos
    expect(f1.head).toBe(headBefore);
    expect(f1.head.next).toBe(tailBefore);
    expect(tailBefore.next).toBeNull();
    expect(f1.length).toBe(2);

    // Contenedores intactos: F1 sigue en A y B; C sigue ocupada por el blocker
    expect(f1.head.cell).toBe(A);
    expect(A.isOccupied()).toBe(true);
    expect(B.isOccupied()).toBe(true);
    expect(C.isOccupied()).toBe(true);

    void blocker;
  });

  test('bloquea aun si la cabeza avanzaría a self (cabeza válida, cola ajena)', () => {
    const { A, B, C } = buildLinearBoard();

    const f1 = new Arrow(A, 2);
    f1.extend(B);
    const blocker = new Arrow(C, 2);

    // El destino de la cabeza (B) es self (su propio cuerpo) → pasaría la fase 3,
    // pero la cola (→ C ocupada ajena) fuerza el bloqueo en la fase 3.5.
    expect(B.isOccupied()).toBe(true); // ocupada por la propia cola de F1 (self)
    const result = f1.advance();

    expect(result.outcome).toBe('blocked');
    expect(f1.head.cell).toBe(A); // no consolidó el avance

    void blocker;
  });

});

// ══════════════════════════════════════════════
// BLOQUE 2 — NO FALSOS POSITIVOS (REGRESIÓN)
// ══════════════════════════════════════════════

describe('Arrow.advance — sin falsos positivos', () => {

  test('avanza (advanced) cuando el destino de la cola está libre', () => {
    const { A, B, C } = buildLinearBoard();

    const f1 = new Arrow(A, 2);
    f1.extend(B);
    // C libre (sin flecha ajena)
    expect(C.isOccupied()).toBe(false);

    const result = f1.advance();

    expect(result.outcome).toBe('advanced');
    // La cadena se reconstruye en las celdas destino [B, C]
    expect(f1.head.cell).toBe(B);
    expect(f1.head.next!.cell).toBe(C);
    expect(f1.length).toBe(2);
    expect(A.isOccupied()).toBe(false);
    expect(B.isOccupied()).toBe(true);
    expect(C.isOccupied()).toBe(true);
  });

  test('cola hacia sumidero se purga (advanced), no bloquea', () => {
    const { A, B } = buildSinkBoard();

    // F1 = [head A (exit 2 → B = self), tail B (→ exit/sumidero)]
    const f1 = new Arrow(A, 2);
    f1.extend(B);
    expect(B.isExit(2)).toBe(true);

    const result = f1.advance();

    // La cola fluye al sumidero y se purga; la flecha se acorta a 1
    expect(result.outcome).toBe('advanced');
    expect(f1.length).toBe(1);
    expect(f1.head.cell).toBe(B);
    expect(A.isOccupied()).toBe(false);
  });

  test('ignora celda ajena fuera de la ruta (lazy checking intacto)', () => {
    const { A, B, C, D } = buildLinearBoard(true);

    // F1 = [head A (→ B self), body B (→ C self), tail C (→ exit sumidero)]
    const f1 = new Arrow(A, 2);
    f1.extend(B);
    f1.extend(C);

    // D ocupada por una entidad ajena, pero NO es destino de ningún segmento de F1
    const blocker = new Arrow(D!, 0);
    expect(D!.isOccupied()).toBe(true);

    const result = f1.advance();

    expect(result.outcome).toBe('advanced');
    // D intacta — F1 nunca la interrogó (no es destino de cola ni cabeza)
    expect(D!.isOccupied()).toBe(true);

    void blocker;
  });

});

// ══════════════════════════════════════════════
// BLOQUE 3 — COMPATIBILIDAD
// ══════════════════════════════════════════════

describe('Arrow.advance — compatibilidad', () => {

  test('colisión de cabeza / 1-celda sigue dando blocked', () => {
    const { A, B } = buildLinearBoard();

    // F1 de 1 celda: cabeza (= cola) en A avanza por port2 → B
    const f1 = new Arrow(A, 2);
    // B ocupada por entidad ajena
    const f2 = new Arrow(B, 2);
    expect(B.isOccupied()).toBe(true);

    const result = f1.advance();

    // Bloqueo por el chequeo de cabeza (fase 3); la fase 3.5 no se alcanza
    expect(result.outcome).toBe('blocked');
    expect(result.freedCellIds).toHaveLength(0);
    expect(result.occupiedCellIds).toHaveLength(0);
    expect(f1.head.cell).toBe(A);

    void f2;
  });

  test('cola hacia celda self nunca bloquea (avanza normal)', () => {
    const { A, B } = buildLoopBoard();

    // F1 = [head A (exit 2 → B = self), tail B (exit 2 → A = self)]
    const f1 = new Arrow(A, 2);
    f1.extend(B);
    // El destino de la cola (A) está ocupado por la propia cabeza de F1 (self)
    expect(A.isOccupied()).toBe(true);

    const result = f1.advance();

    // self no es colisión → la flecha avanza normalmente (loop rota)
    expect(result.outcome).toBe('advanced');
    expect(f1.length).toBe(2);
  });

});
