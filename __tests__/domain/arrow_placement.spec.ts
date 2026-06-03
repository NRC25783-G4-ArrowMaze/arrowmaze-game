/**
 * Arrow Placement Test Suite
 *
 * Covers all 17 scenarios from features/arrow_placement.feature
 *
 * Board topology used in Background:
 *   C1 [port 0: exit, port 1: C2, port 2: exit, port 3: exit]
 *   C2 [port 0: exit, port 1: C3, port 2: exit, port 3: C1]
 *   C3 [port 0: exit, port 1: C4, port 2: exit, port 3: C2]
 *   C4 [port 0: exit, port 1: exit, port 2: exit, port 3: C3]
 *   C5 [port 0: exit, port 1: exit, port 2: exit, port 3: exit] — fully isolated
 *
 * Connection rule: C1[port1] ↔ C2[port3], C2[port1] ↔ C3[port3], C3[port1] ↔ C4[port3]
 * Opposite port rule: (p + portCount/2) mod portCount  →  for P=4: (p+2)%4
 */

import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { Arrow } from '../../src/domain/entities/Arrow';
import { ArrowPlacementError, ArrowCreationError } from '../../src/domain/errors/ArrowErrors';

// ─────────────────────────────────────────────
// HELPER — build the standard 4-port board from the Background
// ─────────────────────────────────────────────

function buildStandardBoard(): {
  board: Board;
  C1: Cell; C2: Cell; C3: Cell; C4: Cell; C5: Cell;
} {
  const board = new Board('test-board');

  const C1 = new Cell('C1', 4);
  const C2 = new Cell('C2', 4);
  const C3 = new Cell('C3', 4);
  const C4 = new Cell('C4', 4);
  const C5 = new Cell('C5', 4);

  [C1, C2, C3, C4, C5].forEach(c => board.addCell(c));

  // C1[port 1] ↔ C2[port 3]
  board.connectPorts(C1, 1, C2, 3);
  // C2[port 1] ↔ C3[port 3]
  board.connectPorts(C2, 1, C3, 3);
  // C3[port 1] ↔ C4[port 3]
  board.connectPorts(C3, 1, C4, 3);
  // C5 stays fully isolated

  return { board, C1, C2, C3, C4, C5 };
}

// ══════════════════════════════════════════════
// BLOQUE 1 — CREACIÓN E INVARIANTES DE LA ENTIDAD FLECHA
// ══════════════════════════════════════════════

describe('Bloque 1 — Creación e invariantes de la entidad Flecha', () => {

  test('Scenario 1: Creación de una flecha mínima (solo cabeza) estableciendo su intención de salida', () => {
    const { C1 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);

    // La flecha existe en memoria de forma independiente
    expect(arrow).toBeDefined();
    // arrow.head ocupa pasivamente a C1
    expect(arrow.head.cell).toBe(C1);
    // arrow.head.isHead es true
    expect(arrow.head.isHead).toBe(true);
    // arrow.head.exitPort es 1
    expect(arrow.head.exitPort).toBe(1);
    // arrow.head.prev es null
    expect(arrow.head.prev).toBeNull();
    // arrow.head.next es null
    expect(arrow.head.next).toBeNull();
    // arrow.length es 1
    expect(arrow.length).toBe(1);
  });

  test('Scenario 2: La cabeza dictamina el inicio de la lista (prev = null)', () => {
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);

    expect(arrow.head.prev).toBeNull();
  });

  test('Scenario 3: El último segmento dictamina el fin de la lista (next = null)', () => {
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);

    // El segmento en C3 es la cola
    const tail = arrow.head.next!.next!;
    expect(tail.getCellId()).toBe('C3');
    expect(tail.next).toBeNull();
  });

  test('Scenario 4: La entidad Flecha enlaza correctamente sus segmentos internos', () => {
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);

    const segC2 = arrow.head.next!;
    expect(segC2.getCellId()).toBe('C2');
    // prev apunta a C1
    expect(segC2.prev!.getCellId()).toBe('C1');
    // next apunta a C3
    expect(segC2.next!.getCellId()).toBe('C3');
  });

  test('Scenario 5: La longitud interna de la Flecha refleja su ocupación en el grafo', () => {
    const { C1, C2, C3, C4 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);
    arrow.extend(C4);

    expect(arrow.length).toBe(4);
  });

  test('Scenario 6: La intención de salida de la cabeza (exitPort) puede apuntar al vacío (fuera del mapa)', () => {
    const { C1 } = buildStandardBoard();

    const arrow = new Arrow(C1, 3); // port 3 of C1 is an exit

    expect(arrow.head.exitPort).toBe(3);
    // C1.port3 is an exit (isExit returns true)
    expect(C1.isExit(3)).toBe(true);
  });

});

// ══════════════════════════════════════════════
// BLOQUE 2 — LÓGICA DE COLOCACIÓN Y AUTO-ENRUTAMIENTO (HAPPY PATH)
// ══════════════════════════════════════════════

describe('Bloque 2 — Lógica de colocación y auto-enrutamiento (Happy Path)', () => {

  test('Scenario 7: Colocación masiva de N segmentos en celdas conectadas', () => {
    const { C1, C2, C3, C4 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);
    arrow.extend(C4);

    // La Flecha se auto-ensambla sobre [C1, C2, C3, C4]
    expect(arrow.length).toBe(4);
    // Las celdas pasivas actualizan su estado a ocupadas
    expect(C1.getArrowSegment()).not.toBeNull();
    expect(C2.getArrowSegment()).not.toBeNull();
    expect(C3.getArrowSegment()).not.toBeNull();
    expect(C4.getArrowSegment()).not.toBeNull();
  });

  test('Scenario 8: Colocación incremental delegada a la entidad Flecha', () => {
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);

    expect(arrow.length).toBe(3);
    // C1.next apunta a C2
    expect(arrow.head.next!.getCellId()).toBe('C2');
    // C2.next apunta a C3
    expect(arrow.head.next!.next!.getCellId()).toBe('C3');
  });

  test('Scenario 9: La entidad Flecha notifica a la celda pasiva sobre su ocupación', () => {
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);

    // C1 recibe y almacena la referencia del segmento
    expect(C1.getArrowSegment()).not.toBeNull();
    expect(C1.getArrowSegment()!.isHead).toBe(true);

    // C2 recibe y almacena la referencia del segmento
    expect(C2.getArrowSegment()).not.toBeNull();
    expect(C2.getArrowSegment()!.isHead).toBe(false);

    // C3 permanece vacía
    expect(C3.getArrowSegment()).toBeNull();
  });

  test('Scenario 10: La Flecha calcula lógicamente sus puertos internos en una trayectoria lineal', () => {
    // Flecha sobre [C1(head, exitPort:1), C2, C3]
    // C1[port1] → C2[port3]: entramos a C2 por port3
    // fromPort de C2 = (1 + 4/2) % 4 = 3
    // C2[port1] → C3[port3]: salimos de C2 por port1, toPort de C2 = 1
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);

    const segC2 = arrow.head.next!;
    expect(segC2.fromPort).toBe(3); // Dedujo que entró desde C1 por port3
    expect(segC2.toPort).toBe(1);   // Dedujo que sale hacia C3 por port1
  });

  test('Scenario 11: La Flecha calcula lógicamente sus puertos internos en una curva', () => {
    // Board especial: C2[port2] conecta con C6[port0]
    const board = new Board('curve-board');
    const C1 = new Cell('C1', 4);
    const C2 = new Cell('C2', 4);
    const C6 = new Cell('C6', 4);
    [C1, C2, C6].forEach(c => board.addCell(c));

    board.connectPorts(C1, 1, C2, 3); // C1→C2 recto
    board.connectPorts(C2, 2, C6, 0); // C2→C6 curva

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C6);

    const segC2 = arrow.head.next!;
    expect(segC2.fromPort).toBe(3); // Entró recta desde C1 (opuesto a port1 = port3)
    expect(segC2.toPort).toBe(2);   // Dobló hacia C6 (port2)
  });

  test('Scenario 12: La Flecha determina que su segmento de cola no tiene puerto de salida', () => {
    // [C1(head, exitPort:1), C2, C3] — C3 es la cola
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);

    const tail = arrow.head.next!.next!; // C3
    expect(tail.getCellId()).toBe('C3');
    expect(tail.fromPort).toBe(3); // (1+2)%4=3, entró por port3
    expect(tail.toPort).toBeNull(); // es cola, sin toPort
  });

});

// ══════════════════════════════════════════════
// BLOQUE 3 — RESTRICCIONES DE COLOCACIÓN
// ══════════════════════════════════════════════

describe('Bloque 3 — Restricciones de colocación', () => {

  test('Scenario 13: La Flecha rechaza extenderse hacia una celda desconectada', () => {
    const { C1, C5 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);

    expect(() => arrow.extend(C5)).toThrow(ArrowPlacementError);
    expect(() => arrow.extend(C5)).toThrow(
      'ArrowPlacementError: cell C5 is not physically connected to previous cell C1'
    );
  });

  test('Scenario 14: La Flecha rechaza colocarse sobre una celda ocupada por otra entidad', () => {
    const { C1, C2 } = buildStandardBoard();

    // F1 ocupa C2
    const f1 = new Arrow(C2, 1);
    // F2 intenta extenderse desde C1 hacia C2
    const f2 = new Arrow(C1, 1);

    expect(() => f2.extend(C2)).toThrow(ArrowPlacementError);
    expect(() => f2.extend(C2)).toThrow(
      'ArrowPlacementError: cell C2 is already occupied by a different entity'
    );

    void f1; // suppress unused variable warning
  });

  test('Scenario 15: La Flecha rechaza la auto-colisión durante la colocación inicial', () => {
    const { C1, C2, C3, C4 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);
    arrow.extend(C4);

    // C4[port3] ↔ C3 — intentamos cerrar el loop hacia C1.
    // C1 está en la misma cadena → auto-colisión.
    // Note: C4 only connects back to C3, not to C1, so we test self via C3 which is in the chain.
    // For the self-collision test, we need a board where C4 connects back to C1.
    const board2 = new Board('loop-board');
    const L1 = new Cell('C1', 4);
    const L2 = new Cell('C2', 4);
    const L3 = new Cell('C3', 4);
    const L4 = new Cell('C4', 4);
    [L1, L2, L3, L4].forEach(c => board2.addCell(c));
    board2.connectPorts(L1, 1, L2, 3);
    board2.connectPorts(L2, 1, L3, 3);
    board2.connectPorts(L3, 1, L4, 3);
    board2.connectPorts(L4, 1, L1, 3); // Closes the loop back to L1

    const arrowLoop = new Arrow(L1, 1);
    arrowLoop.extend(L2);
    arrowLoop.extend(L3);
    arrowLoop.extend(L4);

    // Now L4 connects back to L1 (port1), which is already in the chain
    expect(() => arrowLoop.extend(L1)).toThrow(ArrowPlacementError);
    expect(() => arrowLoop.extend(L1)).toThrow(
      'ArrowPlacementError: structural collision, cell C1 is occupied by self'
    );
  });

  test('Scenario 16: Obligatoriedad de definir la intención de salida (exitPort) al nacer', () => {
    const { C1 } = buildStandardBoard();

    // @ts-expect-error — intentionally passing null to simulate missing exitPort
    expect(() => new Arrow(C1, null)).toThrow(ArrowCreationError);
    // @ts-expect-error
    expect(() => new Arrow(C1, null)).toThrow(
      'ArrowCreationError: head segment requires an explicit exitPort intent'
    );
  });

  test('Scenario 17 (Bloque 3 extra): La Flecha rechaza la obligatoriedad de exitPort', () => {
    const { C1 } = buildStandardBoard();

    // @ts-expect-error — intentionally passing undefined
    expect(() => new Arrow(C1, undefined)).toThrow(ArrowCreationError);
  });

});

// ══════════════════════════════════════════════
// BLOQUE 4 — INVARIANTES MATEMÁTICOS DE LA ENTIDAD
// ══════════════════════════════════════════════

describe('Bloque 4 — Invariantes matemáticos de la entidad', () => {

  test('Scenario 18: El exitPort es una propiedad exclusiva de la cabeza (Motor de dirección)', () => {
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);

    // C1 (cabeza) reporta exitPort = 1
    expect(arrow.head.exitPort).toBe(1);
    // C2 (cuerpo) reporta exitPort = null
    expect(arrow.head.next!.exitPort).toBeNull();
    // C3 (cola) reporta exitPort = null
    expect(arrow.head.next!.next!.exitPort).toBeNull();
  });

  test('Scenario 19: La Flecha obedece la aritmética modular para calcular su fromPort', () => {
    // C1[port1] → C2[port3]: (1 + 4/2) % 4 = 3
    const { C1, C2 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);

    const segC2 = arrow.head.next!;
    expect(segC2.fromPort).toBe(3); // (1 + 2) % 4 = 3
  });

  test('Scenario 20: La cabeza carece de fromPort al no tener un segmento que la preceda', () => {
    const { C1 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);

    expect(arrow.head.fromPort).toBeNull();
  });

  test('Scenario 21: Al ser removida, la Flecha limpia su rastro en los contenedores pasivos', () => {
    const { C1, C2, C3 } = buildStandardBoard();

    const arrow = new Arrow(C1, 1);
    arrow.extend(C2);
    arrow.extend(C3);

    // Verify occupied before destroy
    expect(C1.isOccupied()).toBe(true);
    expect(C2.isOccupied()).toBe(true);
    expect(C3.isOccupied()).toBe(true);

    arrow.destroy();

    // After destroy — all cells freed
    expect(C1.getArrowSegment()).toBeNull();
    expect(C2.getArrowSegment()).toBeNull();
    expect(C3.getArrowSegment()).toBeNull();
    expect(C1.isOccupied()).toBe(false);
    expect(C2.isOccupied()).toBe(false);
    expect(C3.isOccupied()).toBe(false);
  });

});
