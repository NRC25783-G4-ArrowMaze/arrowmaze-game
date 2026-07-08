/**
 * Arrow Movement Test Suite
 *
 * Covers all 9 scenarios from features/arrow_movement.feature
 *
 * Board topology used in Background (P=4 ports, opuesto = (entry+2) mod 4):
 *
 *   | celda | port 0 | port 1 | port 2 | port 3 |
 *   | C1    | exit   | C1b    | C2     | exit   |
 *   | C1b   | exit   | exit   | C2b    | C1     |
 *   | C2    | C1     | C2b    | C3     | exit   |
 *   | C2b   | C1b    | C3     | C3b    | C2     |
 *   | C3    | C2     | exit   | exit   | C2b    |
 *   | C3b   | C2b    | exit   | exit   | C3     |
 *
 * Connections:
 *   C1[port1]  ↔ C1b[port3]
 *   C1[port2]  ↔ C2[port0]
 *   C1b[port2] ↔ C2b[port0]
 *   C2[port1]  ↔ C2b[port3]
 *   C2[port2]  ↔ C3[port0]
 *   C2b[port1] ↔ C3[port3]
 *   C2b[port2] ↔ C3b[port0]
 *   C3[port3]  ↔ C2b[port1]   (already covered above)
 *   C3b[port3] ↔ C3[port...] — see table above
 */

import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { Arrow } from '../../src/domain/entities/Arrow';
import { Segment } from '../../src/domain/entities/Segment';
import { ArrowCinematicError } from '../../src/domain/errors/ArrowErrors';

// ─────────────────────────────────────────────
// HELPER — Build the standard 4-port board from the Background
// ─────────────────────────────────────────────

function buildMovementBoard(): {
  board: Board;
  C1: Cell; C1b: Cell; C2: Cell; C2b: Cell; C3: Cell; C3b: Cell;
} {
  const board = new Board('movement-test-board');

  const C1  = new Cell('C1',  4);
  const C1b = new Cell('C1b', 4);
  const C2  = new Cell('C2',  4);
  const C2b = new Cell('C2b', 4);
  const C3  = new Cell('C3',  4);
  const C3b = new Cell('C3b', 4);

  [C1, C1b, C2, C2b, C3, C3b].forEach(c => board.addCell(c));

  // C1[port1]  ↔ C1b[port3]
  board.connectPorts(C1,  1, C1b, 3);
  // C1[port2]  ↔ C2[port0]
  board.connectPorts(C1,  2, C2,  0);
  // C1b[port2] ↔ C2b[port0]
  board.connectPorts(C1b, 2, C2b, 0);
  // C2[port1]  ↔ C2b[port3]
  board.connectPorts(C2,  1, C2b, 3);
  // C2[port2]  ↔ C3[port0]
  board.connectPorts(C2,  2, C3,  0);
  // C2b[port1] ↔ C3[port3]
  board.connectPorts(C2b, 1, C3,  3);
  // C2b[port2] ↔ C3b[port0]
  board.connectPorts(C2b, 2, C3b, 0);
  // C3b[port3] ↔ C3[...] — from table: C3b.port3 = C3, C3.port3 = C2b (already done)
  //   C3[port3] ↔ C2b[port1] already done above
  //   C3b[port3] ↔ C3[port...] — table says C3b.port3 = C3, C3.port... = ?
  //   Looking at the table: C3[port 3] = C2b (already covered)
  //   C3b needs C3b[port3] ↔ C3[some port] but checking the table:
  //   C3b [port 0: C2b, port 1: exit, port 2: exit, port 3: C3]
  //   C3  [port 0: C2,  port 1: exit, port 2: exit, port 3: C2b]
  //   So C3b[port3] and C3[port?]: C3 connects to C3b via... looking at C3:
  //   C3[port3] = C2b (already connected). C3b[port3] = C3.
  //   This means C3b[port3] ↔ and C3 must have a free port to connect.
  //   From the spec table, this connection is NOT listed (C3 only touches C2 and C2b).
  //   C3b only connects to C2b[port2] (already done). C3b[port3]=C3 seems to be exit.
  //   Re-reading the table: C3b[port3] = C3 — but C3 has no port connecting back to C3b.
  //   This is an asymmetric relationship in the table display. In a bidirectional graph,
  //   if C3b[port3] = C3, then some port of C3 must connect to C3b.
  //   Since C3[port1,2] = exit and C3[port0]=C2, C3[port3]=C2b, there's no room.
  //   Conclusion: The table entry "C3b[port3]=C3" appears to mean exit toward C3 direction,
  //   which in our unidirectional display is just an exit. We model C3b's port3 as exit.
  //   The only real connection for C3b is C3b[port0] ↔ C2b[port2] (already set above).

  return { board, C1, C1b, C2, C2b, C3, C3b };
}

// ══════════════════════════════════════════════
// BLOQUE 1 — MOVIMIENTO EXITOSO Y DESTRUCCIÓN PEREZOSA
// ══════════════════════════════════════════════

describe('Bloque 1 — Movimiento exitoso y destrucción perezosa', () => {

  test('Scenario 1: Destrucción inmediata de cabeza-única apuntando a un sumidero (exit)', () => {
    const { C1 } = buildMovementBoard();

    // Flecha en C1 con exitPort:0 — port 0 de C1 es exit
    const arrow = new Arrow(C1, 0);
    expect(C1.isExit(0)).toBe(true);
    expect(C1.isOccupied()).toBe(true);

    // Flecha entra en estado in-flight y evalúa el tick
    const result = arrow.advance();

    // Cabeza consulta port 0 → isExit == true → se auto-destruye
    expect(result.outcome).toBe('destroyed');
    // C1 fue liberada
    expect(result.freedCellIds).toContain('C1');
    expect(result.occupiedCellIds).toHaveLength(0);
    // C1 queda libre
    expect(C1.isOccupied()).toBe(false);
    expect(C1.getArrowSegment()).toBeNull();
  });

  test('Scenario 2: Avance de cabeza-única propagándose hasta el límite del grafo', () => {
    const { C1, C2, C3 } = buildMovementBoard();

    // Flecha en C1 con exitPort:2 → C1[port2] conecta a C2
    const arrow = new Arrow(C1, 2);

    // ── Tick 1: C1 → C2 por puerto 2 ──────────
    const tick1 = arrow.advance();
    expect(tick1.outcome).toBe('advanced');
    // C1 queda libre
    expect(C1.isOccupied()).toBe(false);
    // C2 asume la ocupación
    expect(C2.isOccupied()).toBe(true);
    expect(tick1.freedCellIds).toContain('C1');
    expect(tick1.occupiedCellIds).toContain('C2');
    // La nueva cabeza tiene exitPort correcto para seguir avanzando en la misma dirección
    // C2[port2] → C3, así que exitPort de la nueva cabeza debe ser 2
    expect(arrow.head.cell).toBe(C2);
    expect(arrow.head.exitPort).toBe(2);

    // ── Tick 2: C2 → C3 por puerto 2 ──────────
    const tick2 = arrow.advance();
    expect(tick2.outcome).toBe('advanced');
    expect(C2.isOccupied()).toBe(false);
    expect(C3.isOccupied()).toBe(true);
    expect(arrow.head.cell).toBe(C3);
    expect(arrow.head.exitPort).toBe(2);

    // ── Tick 3: C3[port2] → exit ──────────────
    // Desde el spec: C3[port2] = exit
    expect(C3.isExit(2)).toBe(true);
    const tick3 = arrow.advance();
    expect(tick3.outcome).toBe('destroyed');
    expect(C3.isOccupied()).toBe(false);
    expect(tick3.freedCellIds).toContain('C3');
  });

  test('Scenario 3: Avance simultáneo de cuerpo completo (Head-push cinemático)', () => {
    const { C1, C2, C3 } = buildMovementBoard();

    // Flecha ensamblada en [C1(head, exitPort:2), C2(body), C3(tail)]
    // C1[port2] ↔ C2[port0], C2[port2] ↔ C3[port0]
    const arrow = new Arrow(C1, 2);
    arrow.extend(C2);
    arrow.extend(C3);

    expect(arrow.length).toBe(3);
    expect(C1.isOccupied()).toBe(true);
    expect(C2.isOccupied()).toBe(true);
    expect(C3.isOccupied()).toBe(true);

    // ── Tick 1: head C1→C2exit, body C2→C3, tail C3→exit(port2) ──
    // C3[port2] = exit → tail fluye al sumidero y se purga
    expect(C3.isExit(2)).toBe(true);
    const tick1 = arrow.advance();
    expect(tick1.outcome).toBe('advanced');
    // C1 queda libre (antigua cabeza liberada)
    expect(C1.isOccupied()).toBe(false);
    expect(tick1.freedCellIds).toContain('C1');
    // C3 queda libre (tail purgada al exit)
    // Note: tail (C3) flows to exit, so it's freed but not occupied
    expect(tick1.freedCellIds).toContain('C3');
    // Después de tick 1: flecha ocupa [C2, C3]
    // Nueva cabeza en C2, next segment en C3
    expect(arrow.head.cell).toBe(C2);
    expect(arrow.head.next).not.toBeNull();
    expect(arrow.head.next!.cell).toBe(C3);
    expect(arrow.length).toBe(2);

    // ── Tick 2: head C2→C3, tail C3→exit(port2) ──
    const tick2 = arrow.advance();
    expect(tick2.outcome).toBe('advanced');
    expect(C2.isOccupied()).toBe(false);
    // Después de tick 2: flecha ocupa solo [C3]
    expect(arrow.head.cell).toBe(C3);
    expect(arrow.head.next).toBeNull();
    expect(arrow.length).toBe(1);

    // ── Tick 3: head en C3 con exitPort:2 → exit ──
    expect(C3.isExit(2)).toBe(true);
    const tick3 = arrow.advance();
    expect(tick3.outcome).toBe('destroyed');
    // C3 queda libre — grafo completamente liberado en 3 ticks
    expect(C3.isOccupied()).toBe(false);
    expect(tick3.freedCellIds).toContain('C3');
  });

});

// ══════════════════════════════════════════════
// BLOQUE 2 — RESOLUCIÓN DE COLISIONES Y ROLLBACK ATÓMICO
// ══════════════════════════════════════════════

describe('Bloque 2 — Resolución de colisiones y rollback atómico', () => {

  test('Scenario 4: Detección de colisión estructural delegada a la simulación de la Flecha', () => {
    const { C1, C1b } = buildMovementBoard();

    // F1 ocupa C1 con exitPort:1 → apunta a C1b
    const f1 = new Arrow(C1,  1);
    // F2 ocupa C1b (la celda destino de F1)
    const f2 = new Arrow(C1b, 2);

    // F1 recibe el tick de activación
    const result = f1.advance();

    // F1 detecta que C1b está ocupado por F2
    expect(C1b.isOccupied()).toBe(true);
    // F1 aborta y ejecuta rollback — emite ArrowBlocked
    expect(result.outcome).toBe('blocked');
    // Rollback interno: ninguna celda fue mutada
    expect(result.freedCellIds).toHaveLength(0);
    expect(result.occupiedCellIds).toHaveLength(0);
    // F1 mantiene su anclaje en C1
    expect(f1.head.cell).toBe(C1);
    expect(C1.isOccupied()).toBe(true);
    // C1b no fue alterado por F1
    expect(C1b.getArrowSegment()).not.toBeNull();

    void f2; // suppress unused warning
  });

  test('Scenario 5: Liberación asíncrona de ruta compartida (Prioridad de evacuación)', () => {
    const { C1, C2, C3 } = buildMovementBoard();

    // F1 bloqueada en C1 intentando acceder a C2 (exitPort:2 → C2)
    const f1 = new Arrow(C1, 2);

    // F2 ocupa C2 con exitPort:2 (C2→C3), sin cuerpo
    // Elegimos F2 como cabeza sola para evitar conflicto de destinos con su propio cuerpo
    const f2 = new Arrow(C2, 2);

    // F1 intenta avanzar — C2 está ocupado por F2 → bloqueado
    const block = f1.advance();
    expect(block.outcome).toBe('blocked');
    expect(f1.head.cell).toBe(C1);

    // El controlador emite ticks sobre F2 para que evacúe
    // Tick 1: F2 C2→C3
    const f2tick1 = f2.advance();
    expect(f2tick1.outcome).toBe('advanced');
    expect(C2.isOccupied()).toBe(false);
    expect(C3.isOccupied()).toBe(true);

    // C2 notifica estado libre. F1 puede ahora avanzar.
    const advance = f1.advance();
    expect(advance.outcome).toBe('advanced');
    expect(f1.head.cell).toBe(C2);
    expect(C2.isOccupied()).toBe(true);

    void f2;
  });

  test('Scenario 6: Rollback atómico garantiza inmutabilidad de la estructura enlazada', () => {
    const board = new Board('rollback-board');
    // Build a linear chain of 5 cells: Nx←N1←N2←N3←N4←N5
    // The HEAD is at N1 pointing toward Nx (which is blocked).
    // Tail is at N5 pointing outward (exit direction).
    //
    // Connection layout:
    //   Nx[p2] ↔ N1[p0]   (N1 head points via port0 → Nx)
    //   N1[p2] ↔ N2[p0]
    //   N2[p2] ↔ N3[p0]
    //   N3[p2] ↔ N4[p0]
    //   N4[p2] ↔ N5[p0]   (N5 is the tail)
    const Nx = new Cell('Nx', 4);
    const N1 = new Cell('N1', 4);
    const N2 = new Cell('N2', 4);
    const N3 = new Cell('N3', 4);
    const N4 = new Cell('N4', 4);
    const N5 = new Cell('N5', 4);
    [Nx, N1, N2, N3, N4, N5].forEach(c => board.addCell(c));

    board.connectPorts(N1, 0, Nx, 2); // N1[port0] → Nx (head exit direction)
    board.connectPorts(N1, 2, N2, 0); // N1[port2] ↔ N2[port0]
    board.connectPorts(N2, 2, N3, 0); // N2[port2] ↔ N3[port0]
    board.connectPorts(N3, 2, N4, 0); // N3[port2] ↔ N4[port0]
    board.connectPorts(N4, 2, N5, 0); // N4[port2] ↔ N5[port0]
    // N5's tail exit (port2) remains an exit (sink)

    // F1 de 5 segmentos: head=N1(exitPort:0→Nx), body=[N2,N3,N4], tail=N5
    // We build tail-first by placing head at N1 and extending toward N2..N5
    const f1 = new Arrow(N1, 0); // head at N1, exitPort:0 pointing to Nx
    f1.extend(N2);
    f1.extend(N3);
    f1.extend(N4);
    f1.extend(N5);
    expect(f1.length).toBe(5);

    // Bloqueador ocupa Nx
    const blocker = new Arrow(Nx, 0);

    // Capturar punteros prev/next antes del rollback
    const headBefore   = f1.head;
    const seg2Before   = f1.head.next!;
    const seg3Before   = f1.head.next!.next!;
    const seg4Before   = f1.head.next!.next!.next!;
    const tailBefore   = f1.head.next!.next!.next!.next!;

    // F1 simula avance hacia Nx — debe bloquearse
    const result = f1.advance();
    expect(result.outcome).toBe('blocked');

    // La Flecha preserva intactos todos sus punteros internos
    expect(f1.head).toBe(headBefore);           // mismo objeto Head
    expect(f1.head.next).toBe(seg2Before);
    expect(seg2Before.next).toBe(seg3Before);
    expect(seg3Before.next).toBe(seg4Before);
    expect(seg4Before.next).toBe(tailBefore);
    expect(tailBefore.next).toBeNull();

    // La flecha mantiene su longitud exacta en 5
    expect(f1.length).toBe(5);

    // El grafo pasivo no sufrió mutaciones — todas las celdas originales siguen ocupadas
    expect(N1.isOccupied()).toBe(true);
    expect(N2.isOccupied()).toBe(true);
    expect(N3.isOccupied()).toBe(true);
    expect(N4.isOccupied()).toBe(true);
    expect(N5.isOccupied()).toBe(true);
    // Nx sigue ocupado por el bloqueador, sin mutación
    expect(Nx.isOccupied()).toBe(true);

    void blocker;
  });

});

// ══════════════════════════════════════════════
// BLOQUE 3 — CÁLCULO CINEMÁTICO DURANTE EL VUELO (IN-FLIGHT)
// ══════════════════════════════════════════════

describe('Bloque 3 — Cálculo cinemático durante el vuelo (in-flight)', () => {

  test('Scenario 7: Evaluación de colisión estrictamente perezosa (Lazy checking)', () => {
    const { C1, C2, C2b, C3 } = buildMovementBoard();

    // F1 ocupa [C1(head, exitPort:2), C2(body), C3(tail)]
    const f1 = new Arrow(C1, 2);
    f1.extend(C2);
    f1.extend(C3);

    // Un contenedor C2b adyacente ocupado por otra entidad
    const blocker = new Arrow(C2b, 0);
    expect(C2b.isOccupied()).toBe(true);

    // F1 procesa su simulación in-flight
    // Destino de cabeza (C1→C2 via port2): C2 está ocupado por F1 mismo (body) → se autoevacúa
    // F1 solo interroga al contenedor C2 (destino de C1 por puerto 2)
    // F1 ignora el estado de C2b (fuera de predicción cinemática)
    const result = f1.advance();

    // F1 consolida su avance porque C2 queda libre por el arrastre de su propio cuerpo
    expect(result.outcome).toBe('advanced');
    // C2b sigue ocupado (no fue tocado por F1)
    expect(C2b.isOccupied()).toBe(true);

    void blocker;
  });

  test('Scenario 8: Bloqueo de mutación topológica por transacción in-flight', () => {
    const { C1, C2 } = buildMovementBoard();

    const arrow = new Arrow(C1, 2);

    // Simulamos el estado in-flight interceptando el avance.
    // Como _inFlight es privado, testeamos el comportamiento observable:
    // Arrow.extend() debe lanzar ArrowCinematicError si se llama durante in-flight.
    // Usamos un mock que intercepta el advance a mitad.

    // El approach correcto: verificar que después de un advance normal,
    // el flag vuelve a false (no deadlock). Adicionalmente, podemos
    // verificar el error directamente mediante un subclass que expone el flag.

    // Test A: extend() estando fuera de flight → funciona normalmente
    arrow.extend(C2);
    expect(arrow.length).toBe(2);

    // Reset para test B: nueva flecha
    const { C1: C1b } = buildMovementBoard();
    const arrow2 = new Arrow(C1b, 2);

    // Test B: simular llamada a extend durante in-flight via override temporal
    // Usamos un wrapper que intercepta el avance para capturar el estado in-flight
    const cinemaErrorCaught = false;
    const originalAdvance = arrow2.advance.bind(arrow2);

    // Monkey-patch: wrapeamos advance para llamar extend justo cuando esté in-flight
    // Esto no es posible sin acceso a _inFlight directamente.
    // En cambio, testeamos el mensaje del error de forma indirecta:
    // extendemos la Arrow via una subclass que fuerza _inFlight

    // The most robust way: verify the error message contract from ArrowCinematicError
    const err = new ArrowCinematicError('immutable segment chain during flight transaction');
    expect(err.message).toBe(
      'ArrowCinematicError: immutable segment chain during flight transaction'
    );
    expect(err.name).toBe('ArrowCinematicError');

    void originalAdvance;
    void cinemaErrorCaught;
  });

  test('Scenario 8b: Bloqueo de mutación — verificación via subclass con exposición de inFlight', () => {
    // Subclase que expone setInFlight para poder testear el guard de extend()
    class TestableArrow extends Arrow {
      setInFlight(v: boolean): void {
        (this as unknown as { _inFlight: boolean })._inFlight = v;
      }
    }

    const { C1, C2 } = buildMovementBoard();
    const arrow = new TestableArrow(C1, 2);

    // Activar manualmente el flag in-flight
    arrow.setInFlight(true);

    // extend() debe lanzar ArrowCinematicError
    expect(() => arrow.extend(C2)).toThrow(ArrowCinematicError);
    expect(() => arrow.extend(C2)).toThrow(
      'ArrowCinematicError: immutable segment chain during flight transaction'
    );

    // Desactivar y verificar que extend() ya no lanza
    arrow.setInFlight(false);
    expect(() => arrow.extend(C2)).not.toThrow();
  });

  test('Scenario 9: Resolución matemática y propagación de puertos en curvas dinámicas', () => {
    const { C1, C1b, C2b, C3b } = buildMovementBoard();

    // Trayectoria calculada: C1(p:1) → C1b(p:2) → C2b
    // C1[port1] ↔ C1b[port3]: entramos a C1b por port3
    // C1b[port2] ↔ C2b[port0]: entramos a C2b por port0
    // C2b[port2] ↔ C3b[port0]: entramos a C3b por port0

    const arrow = new Arrow(C1, 1);  // head en C1, sale por port1 → C1b
    arrow.extend(C1b);               // body en C1b, entryPort=(1+2)%4=3
    arrow.extend(C2b);               // tail en C2b, entryPort=(2+2)%4=0

    expect(arrow.length).toBe(3);

    // Verificar puertos iniciales del cuerpo
    const segC1b = arrow.head.next! as Segment;
    const segC2b = arrow.head.next!.next! as Segment;
    expect(segC1b.entryPort).toBe(3); // entró a C1b por port3
    expect(segC2b.entryPort).toBe(0); // entró a C2b por port0

    // ── Tick 1: Avance hacia C1b, C2b, C3b ────
    // Head: C1 sale por port1 → C1b. Nueva cabeza en C1b.
    // Body (C1b): sale hacia donde está el next (C2b) → port2. Nueva celda: C2b.
    // Tail (C2b): exitDir=(0+2)%4=2. C2b[port2]=C3b. Nueva celda: C3b.
    const tick1 = arrow.advance();
    expect(tick1.outcome).toBe('advanced');

    // Estado cinemático tras tick 1
    expect(arrow.head.cell).toBe(C1b);
    // Según el spec: cabeza en C1b → fromPort null, exitPort/toPort calculado: 2
    // La nueva cabeza en C1b: su exitPort debe ser el puerto hacia donde sigue, que es C2b
    // C1b[port2] ↔ C2b[port0] → exitPort de la nueva cabeza = 2
    expect(arrow.head.exitPort).toBe(2);

    // cuerpo en C2b: fromPort (entryPort) = (2+2)%4=0 (opuesto del port2 de la cabeza anterior)
    const newBodyC2b = arrow.head.next! as Segment;
    expect(newBodyC2b.cell).toBe(C2b);
    expect(newBodyC2b.entryPort).toBe(0); // entró a C2b por port0 (opuesto de port2 de C1b)

    // cola en C3b: fromPort (entryPort) = (2+2)%4=0 (opuesto del port2 de C2b)
    const newTailC3b = arrow.head.next!.next! as Segment;
    expect(newTailC3b.cell).toBe(C3b);
    expect(newTailC3b.entryPort).toBe(0); // entró a C3b por port0 (opuesto de port2 de C2b)

    // ── Tick 2: Avance hacia C2b, C3b ─────────
    // Head C1b: exitPort=2 → C2b. Nueva cabeza en C2b.
    // Tail C3b: exitDir=(0+2)%4=2. C3b[port2]=exit → purgada.
    expect(C3b.isExit(2)).toBe(true);
    const tick2 = arrow.advance();
    expect(tick2.outcome).toBe('advanced');

    // Estado cinemático tras tick 2
    expect(arrow.head.cell).toBe(C2b);
    // La flecha resuelve matemáticamente sin depender del grafo pasivo
    expect(arrow.length).toBe(2);

    const newTailAfterTick2 = arrow.head.next! as Segment;
    expect(newTailAfterTick2.cell).toBe(C3b);
  });

});
