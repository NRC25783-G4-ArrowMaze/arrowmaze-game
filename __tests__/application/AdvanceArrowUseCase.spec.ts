/**
 * AdvanceArrowUseCase Test Suite
 *
 * Integration tests for the application layer use case.
 * Validates that the use case correctly maps domain results to DTOs
 * and handles all three outcome scenarios gracefully.
 */

import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { Arrow } from '../../src/domain/entities/Arrow';
import { AdvanceArrowUseCase } from '../../src/application/use-cases/AdvanceArrowUseCase';

// ─────────────────────────────────────────────
// HELPER — Minimal linear board for use case tests
// ─────────────────────────────────────────────

function buildLinearBoard(): { board: Board; A: Cell; B: Cell; C: Cell } {
  const board = new Board('usecase-board');
  const A = new Cell('A', 4);
  const B = new Cell('B', 4);
  const C = new Cell('C', 4);
  [A, B, C].forEach(c => board.addCell(c));

  // A[port2] ↔ B[port0] ↔ C[port2] — B[port2]=exit, C[port2]=exit
  board.connectPorts(A, 2, B, 0);
  board.connectPorts(B, 2, C, 0);
  // C[port2] remains an exit (no further connection)

  return { board, A, B, C };
}

// ══════════════════════════════════════════════
// SUITE — AdvanceArrowUseCase
// ══════════════════════════════════════════════

describe('AdvanceArrowUseCase', () => {
  let useCase: AdvanceArrowUseCase;

  beforeEach(() => {
    useCase = new AdvanceArrowUseCase();
  });

  // ─────────────────────────────────────────────
  // Advance exitoso
  // ─────────────────────────────────────────────

  test('Advance exitoso — retorna DTO con success:true y segmentos actualizados', () => {
    const { board, A, B } = buildLinearBoard();
    const arrow = new Arrow(A, 2); // A[port2] → B

    const result = useCase.execute({ board, arrow });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('advanced');
    expect(result.arrowLength).toBe(1);
    expect(result.error).toBeUndefined();

    // Segmentos reflejan la nueva posición
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].cellId).toBe('B');
    expect(result.segments[0].isHead).toBe(true);
    expect(result.segments[0].exitPort).toBe(2); // B[port2] → C

    // Celdas afectadas
    expect(result.freedCellIds).toContain('A');
    expect(result.occupiedCellIds).toContain('B');

    // Estado del grafo
    expect(A.isOccupied()).toBe(false);
    expect(B.isOccupied()).toBe(true);
  });

  test('Advance con cuerpo — DTO refleja toda la cadena actualizada', () => {
    const { board, A, B } = buildLinearBoard();

    // Flecha de 2 segmentos: A(head,exitPort:2), B(body)
    const arrow = new Arrow(A, 2);
    arrow.extend(B);
    expect(arrow.length).toBe(2);

    const result = useCase.execute({ board, arrow });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('advanced');
    // Después del tick: [B(head), C(body)] — C[port2]=exit, tail se purga
    // C[port0] = B (entry), exitDir de tail = (0+2)%4=2, C[port2]=exit → tail purgada
    // Wait: tail B exits toward C via port2. C becomes new body.
    // C (new tail) exits via (0+2)%4=2 = exit. But that only purges NEXT tick.
    // After tick 1: [B(head,exitPort:2), C(body)]
    expect(result.arrowLength).toBe(2);
    expect(result.segments[0].cellId).toBe('B');
    expect(result.segments[0].isHead).toBe(true);
    expect(result.segments[1].cellId).toBe('C');
    expect(result.segments[1].isHead).toBe(false);
    expect(result.segments[1].entryPort).toBe(0); // C[port0] entered from B[port2]

    expect(result.freedCellIds).toContain('A');
    expect(result.occupiedCellIds).toContain('C'); // C newly occupied
  });

  // ─────────────────────────────────────────────
  // Arrow bloqueada
  // ─────────────────────────────────────────────

  test('Arrow bloqueada — DTO retorna outcome:blocked y estado sin cambios', () => {
    const { board, A, B } = buildLinearBoard();

    // F1 en A apuntando a B
    const f1 = new Arrow(A, 2);
    // Bloqueador en B
    const blocker = new Arrow(B, 2);

    const result = useCase.execute({ board, arrow: f1 });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('blocked');
    expect(result.arrowLength).toBe(1);
    expect(result.error).toBeUndefined();

    // Sin mutación: arrays vacíos
    expect(result.freedCellIds).toHaveLength(0);
    expect(result.occupiedCellIds).toHaveLength(0);

    // El segmento de la flecha sigue siendo A (estado no cambiado)
    expect(result.segments[0].cellId).toBe('A');
    expect(A.isOccupied()).toBe(true);
    expect(B.isOccupied()).toBe(true);

    void blocker;
  });

  // ─────────────────────────────────────────────
  // Arrow destruida
  // ─────────────────────────────────────────────

  test('Arrow destruida — DTO retorna outcome:destroyed y segments vacío', () => {
    const { board, A } = buildLinearBoard();

    // Flecha en A con exitPort:0 (port 0 de A es exit)
    expect(A.isExit(0)).toBe(true);
    const arrow = new Arrow(A, 0);

    const result = useCase.execute({ board, arrow });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('destroyed');
    expect(result.arrowLength).toBe(0);
    expect(result.segments).toHaveLength(0);
    expect(result.occupiedCellIds).toHaveLength(0);
    expect(result.freedCellIds).toContain('A');
    expect(result.error).toBeUndefined();

    // El grafo quedó completamente liberado
    expect(A.isOccupied()).toBe(false);
  });

  test('Arrow que avanza a sumidero tras viajar — destroyed con celdas liberadas', () => {
    const { board, A, B, C } = buildLinearBoard();

    // Flecha en A, avanzar hasta que llegue al sumidero
    const arrow = new Arrow(A, 2); // A→B

    // Tick 1: A→B (advanced)
    const tick1 = useCase.execute({ board, arrow });
    expect(tick1.outcome).toBe('advanced');
    expect(arrow.head.cell).toBe(B);

    // Tick 2: B[port2]→C (advanced)
    const tick2 = useCase.execute({ board, arrow });
    expect(tick2.outcome).toBe('advanced');
    expect(arrow.head.cell).toBe(C);

    // Tick 3: C[port2] es exit → destroyed
    const tick3 = useCase.execute({ board, arrow });
    expect(tick3.outcome).toBe('destroyed');
    expect(tick3.arrowLength).toBe(0);
    expect(tick3.segments).toHaveLength(0);

    void A; void B; // suppress warnings
  });
});

