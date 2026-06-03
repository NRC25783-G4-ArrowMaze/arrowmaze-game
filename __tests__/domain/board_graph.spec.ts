import { Cell } from '../../src/domain/entities/Cell';
import { Board } from '../../src/domain/entities/Board';
import { Port } from '../../src/domain/value-objects/Port';
import { TopologyValidator } from '../../src/domain/services/TopologyValidator';
import { TopologyQueryService } from '../../src/domain/services/TopologyQueryService';

describe('Board Graph - Port-Based Topology (BDD Scenarios)', () => {
  // ══════════════════════════════════════════════
  // BLOQUE 1 — CREACIÓN DE CELDA Y TOPOLOGÍA
  // ══════════════════════════════════════════════

  describe('BLOQUE 1: Cell Creation and Topology', () => {
    describe('Scenario: Creación de una celda con topología válida (ej. Cuadrado)', () => {
      it('should create a cell with 4 ports', () => {
        const cell = new Cell('c1', 4);
        expect(cell.getId()).toBe('c1');
        expect(cell.getPortCount()).toBe(4);
      });

      it('should have exactly 4 ports indexed from 0 to 3', () => {
        const cell = new Cell('c1', 4);
        for (let i = 0; i < 4; i++) {
          expect(cell.getPortAtIndex(i)).toBeDefined();
        }
      });

      it('all ports should initially be exits (no neighbor connected)', () => {
        const cell = new Cell('c1', 4);
        for (let i = 0; i < 4; i++) {
          expect(cell.isExit(i)).toBe(true);
        }
      });

      it('should have no segment occupying it initially', () => {
        const cell = new Cell('c1', 4);
        expect(cell.hasArrowSegment()).toBe(false);
      });
    });

    describe('Scenario: Creación de una celda con topología extendida (ej. Hexágono)', () => {
      it('should create a cell with 6 ports', () => {
        const cell = new Cell('c1', 6);
        expect(cell.getPortCount()).toBe(6);
      });

      it('should have exactly 6 ports indexed from 0 to 5', () => {
        const cell = new Cell('c1', 6);
        for (let i = 0; i < 6; i++) {
          expect(cell.getPortAtIndex(i)).toBeDefined();
        }
      });

      it('all ports should initially be exits', () => {
        const cell = new Cell('c1', 6);
        for (let i = 0; i < 6; i++) {
          expect(cell.isExit(i)).toBe(true);
        }
      });
    });

    describe('Scenario: Rechazo de celda con topología impar', () => {
      it('should throw TopologyError for 5 ports (odd)', () => {
        expect(() => new Cell('c1', 5)).toThrow('TopologyError: port count must be an even number');
      });

      it('should throw TopologyError for 3 ports (odd)', () => {
        expect(() => new Cell('c1', 3)).toThrow('TopologyError: port count must be an even number');
      });

      it('should throw TopologyError for 1 port (odd)', () => {
        expect(() => new Cell('c1', 1)).toThrow('TopologyError: port count must be an even number');
      });
    });

    describe('Scenario: La capacidad topológica es inmutable después de la creación', () => {
      it('should not allow modification of port count after creation', () => {
        const cell = new Cell('c1', 4);
        expect(() => (cell as any).portCount = 6).toThrow();
      });

      it('should not allow ports array mutation', () => {
        const cell = new Cell('c1', 4);
        const ports = (cell as any).ports;
        expect(() => {
          ports.push(new Port(4));
        }).toThrow();
      });

      it('should freeze ports array on construction', () => {
        const cell = new Cell('c1', 4);
        expect(() => {
          const p = cell.getPortAtIndex(0);
          (p as any).index = 999;
        }).toThrow();
      });
    });
  });

  // ══════════════════════════════════════════════
  // BLOQUE 2 — CELDA ÚNICA Y OCUPACIÓN PASIVA
  // ══════════════════════════════════════════════

  describe('BLOQUE 2: Single Cell and Passive Occupation', () => {
    describe('Scenario: Celda única tiene todos sus puertos libres', () => {
      it('all ports should return isExit() == true for single isolated cell', () => {
        const board = new Board('board1');
        const cell = new Cell('c1', 4);
        board.addCell(cell);

        for (let i = 0; i < 4; i++) {
          expect(cell.isExit(i)).toBe(true);
        }
      });

      it('cell should have no neighbors referenced', () => {
        const cell = new Cell('c1', 4);
        for (let i = 0; i < 4; i++) {
          expect(cell.getNeighborAtPort(i)).toBeNull();
        }
      });
    });

    describe('Scenario: Celda única permite ser ocupada por la cabeza de una flecha', () => {
      it('should allow placing arrow head on single cell', () => {
        const cell = new Cell('c1', 4);
        const arrowSegment = { isHead: true, cellId: 'c1' };
        cell.placeArrowSegment(arrowSegment);
        expect(cell.hasArrowSegment()).toBe(true);
        expect(cell.getArrowSegment()?.isHead).toBe(true);
      });

      it('cell should be in occupied state after placing head', () => {
        const cell = new Cell('c1', 4);
        const arrowSegment = { isHead: true, cellId: 'c1' };
        cell.placeArrowSegment(arrowSegment);
        expect(cell.isOccupied()).toBe(true);
      });
    });

    describe('Scenario: Celda única acepta un segmento de cuerpo de flecha (Arrow valida topología)', () => {
      it('should allow placing body segment on any cell — topology validation belongs to Arrow', () => {
        // Per design decision Q5: Cell is a passive container. The old validation
        // (connections.size < 2 for body segments) was removed because:
        // 1. The tail segment of an arrow legitimately occupies a cell with only 1 connection
        // 2. Arrow.extend() validates connectivity before calling placeArrowSegment()
        const cell = new Cell('c1', 4);
        const bodySegment = { isHead: false, cellId: 'c1' };
        expect(() => cell.placeArrowSegment(bodySegment)).not.toThrow();
        expect(cell.hasArrowSegment()).toBe(true);
        expect(cell.getArrowSegment()?.isHead).toBe(false);
      });
    });
  });

  // ══════════════════════════════════════════════
  // BLOQUE 3 — CONEXIONES ESTRUCTURALES DEL GRAFO
  // ══════════════════════════════════════════════

  describe('BLOQUE 3: Graph Connection Rules', () => {
    describe('Scenario: Conexión bidireccional exitosa entre dos celdas', () => {
      it('should create bidirectional connection between two cells', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        const cellB = new Cell('cB', 4);

        board.addCell(cellA);
        board.addCell(cellB);

        board.connectPorts(cellA, 1, cellB, 3);

        // Check forward direction: A port 1 points to B
        expect(cellA.getNeighborAtPort(1)).toBe(cellB);
        expect((cellA as any).connections.get(1)?.neighborPortIndex).toBe(3);

        // Check reverse direction: B port 3 points to A
        expect(cellB.getNeighborAtPort(3)).toBe(cellA);
        expect((cellB as any).connections.get(3)?.neighborPortIndex).toBe(1);
      });

      it('should mark connected ports as NOT exits', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        const cellB = new Cell('cB', 4);

        board.addCell(cellA);
        board.addCell(cellB);

        expect(cellA.isExit(1)).toBe(true);
        expect(cellB.isExit(3)).toBe(true);

        board.connectPorts(cellA, 1, cellB, 3);

        expect(cellA.isExit(1)).toBe(false);
        expect(cellB.isExit(3)).toBe(false);
      });

      it('other ports should remain as exits after connection', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        const cellB = new Cell('cB', 4);

        board.addCell(cellA);
        board.addCell(cellB);

        board.connectPorts(cellA, 1, cellB, 3);

        expect(cellA.isExit(0)).toBe(true);
        expect(cellA.isExit(2)).toBe(true);
        expect(cellA.isExit(3)).toBe(true);
      });
    });

    describe('Scenario: Rechazo de auto-conexión (bucle topológico)', () => {
      it('should reject self-connection attempt', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        board.addCell(cellA);

        expect(() => board.connectPorts(cellA, 0, cellA, 2)).toThrow(
          'ConnectionError: a cell cannot connect to itself'
        );
      });
    });

    describe('Scenario: Rechazo de conexión en puerto ya ocupado', () => {
      it('should reject connection if source port already occupied', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        const cellB = new Cell('cB', 4);
        const cellC = new Cell('cC', 4);

        board.addCell(cellA);
        board.addCell(cellB);
        board.addCell(cellC);

        board.connectPorts(cellA, 1, cellB, 3);

        expect(() => board.connectPorts(cellA, 1, cellC, 0)).toThrow(
          'ConnectionError: port 1 of cell cA is already occupied'
        );
      });

      it('should reject connection if target port already occupied', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        const cellB = new Cell('cB', 4);
        const cellC = new Cell('cC', 4);

        board.addCell(cellA);
        board.addCell(cellB);
        board.addCell(cellC);

        board.connectPorts(cellA, 1, cellB, 3);

        expect(() => board.connectPorts(cellC, 0, cellB, 3)).toThrow(
          'ConnectionError: port 3 of cell cB is already occupied'
        );
      });
    });

    describe('Scenario: Desconexión explícita libera los recursos en ambos extremos', () => {
      it('should disconnect ports and revert both to exits', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        const cellB = new Cell('cB', 4);

        board.addCell(cellA);
        board.addCell(cellB);

        board.connectPorts(cellA, 1, cellB, 3);
        expect(cellA.isExit(1)).toBe(false);
        expect(cellB.isExit(3)).toBe(false);

        board.disconnectPort(cellA, 1);

        expect(cellA.isExit(1)).toBe(true);
        expect(cellB.isExit(3)).toBe(true);
        expect(cellA.getNeighborAtPort(1)).toBeNull();
        expect(cellB.getNeighborAtPort(3)).toBeNull();
      });

      it('should cleanup both directions of the connection', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        const cellB = new Cell('cB', 4);

        board.addCell(cellA);
        board.addCell(cellB);

        board.connectPorts(cellA, 1, cellB, 3);
        board.disconnectPort(cellB, 3);

        expect(cellB.getNeighborAtPort(3)).toBeNull();
        expect(cellA.getNeighborAtPort(1)).toBeNull();
        expect((cellA as any).connections.get(1)).toBeUndefined();
        expect((cellB as any).connections.get(3)).toBeUndefined();
      });
    });
  });

  // ══════════════════════════════════════════════
  // BLOQUE 4 — GESTIÓN DEL CONTENEDOR (BOARD)
  // ══════════════════════════════════════════════

  describe('BLOQUE 4: Board Container Management', () => {
    describe('Scenario: Creación de un board vacío', () => {
      it('should create empty board', () => {
        const board = new Board('board1');
        expect(board.getId()).toBe('board1');
        expect(board.getAllCells().length).toBe(0);
      });
    });

    describe('Scenario: Agregación de nodos y construcción de la red pasiva', () => {
      it('should add cells to board', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);
        const c3 = new Cell('c3', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.addCell(c3);

        expect(board.getAllCells().length).toBe(3);
      });

      it('should connect cells and build passive network', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);
        const c3 = new Cell('c3', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.addCell(c3);

        board.connectPorts(c1, 1, c2, 3);
        board.connectPorts(c2, 1, c3, 3);

        expect(c2.getNeighborAtPort(3)).toBe(c1);
        expect(c2.getNeighborAtPort(1)).toBe(c3);
      });

      it('C2 should act as structural bridge with 2 connected neighbors', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);
        const c3 = new Cell('c3', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.addCell(c3);

        board.connectPorts(c1, 1, c2, 3);
        board.connectPorts(c2, 1, c3, 3);

        // C2 has 2 connected ports
        expect(c2.isExit(3)).toBe(false);
        expect(c2.isExit(1)).toBe(false);
        // C2 has 2 free ports
        expect(c2.isExit(0)).toBe(true);
        expect(c2.isExit(2)).toBe(true);
      });

      it('C1 port 3 and C3 port 1 should remain as exits', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);
        const c3 = new Cell('c3', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.addCell(c3);

        board.connectPorts(c1, 1, c2, 3);
        board.connectPorts(c2, 1, c3, 3);

        expect(c1.isExit(3)).toBe(true);
        expect(c3.isExit(1)).toBe(true);
      });
    });

    describe('Scenario: Rechazo de celdas duplicadas en el board', () => {
      it('should reject duplicate cell IDs', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);

        board.addCell(c1);
        expect(() => board.addCell(c1)).toThrow('BoardRegistryError: cell ID already exists in this board');
      });

      it('should reject adding another cell with same ID', () => {
        const board = new Board('board1');
        const c1a = new Cell('c1', 4);
        const c1b = new Cell('c1', 4);

        board.addCell(c1a);
        expect(() => board.addCell(c1b)).toThrow('BoardRegistryError: cell ID already exists in this board');
      });
    });

    describe('Scenario: Eliminación de una celda aísla a sus vecinos', () => {
      it('should remove cell and revert neighbor connections to exits', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);
        const c3 = new Cell('c3', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.addCell(c3);

        board.connectPorts(c1, 1, c2, 3);
        board.connectPorts(c2, 1, c3, 3);

        board.removeCell('c2');

        expect(board.getAllCells().length).toBe(2);
        expect(c1.isExit(1)).toBe(true);
        expect(c3.isExit(3)).toBe(true);
        expect(c1.getNeighborAtPort(1)).toBeNull();
        expect(c3.getNeighborAtPort(3)).toBeNull();
      });

      it('should maintain isolation after removal', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);
        const c3 = new Cell('c3', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.addCell(c3);

        board.connectPorts(c1, 1, c2, 3);
        board.connectPorts(c2, 1, c3, 3);

        board.removeCell('c2');

        // Verify c1 and c3 have no path through removed c2
        for (let i = 0; i < 4; i++) {
          if (c1.getNeighborAtPort(i)) {
            expect(c1.getNeighborAtPort(i)).not.toBe(c2);
          }
          if (c3.getNeighborAtPort(i)) {
            expect(c3.getNeighborAtPort(i)).not.toBe(c2);
          }
        }
      });
    });

    describe('Scenario: Rechazo de eliminación si la celda contiene una entidad activa', () => {
      it('should reject removal of occupied cell', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        board.addCell(c1);

        const arrowSegment = { isHead: true, cellId: 'c1' };
        c1.placeArrowSegment(arrowSegment);

        expect(() => board.removeCell('c1')).toThrow(
          'BoardMutationError: cannot remove an occupied cell'
        );
      });

      it('should allow removal once cell is freed', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        board.addCell(c1);

        const arrowSegment = { isHead: true, cellId: 'c1' };
        c1.placeArrowSegment(arrowSegment);

        c1.removeArrowSegment();

        expect(() => board.removeCell('c1')).not.toThrow();
        expect(board.getAllCells().length).toBe(0);
      });
    });
  });

  // ══════════════════════════════════════════════
  // BLOQUE 5 — CONSULTAS TOPOLÓGICAS
  // ══════════════════════════════════════════════

  describe('BLOQUE 5: Topology Queries (Passive Grafo)', () => {
    describe('Scenario: La celda responde consultas de adyacencia pasivamente', () => {
      it('should return correct neighbor at port', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.connectPorts(c1, 2, c2, 0);

        const queryService = new TopologyQueryService();
        const neighbor = queryService.getNeighborCell(c1, 2);

        expect(neighbor).toBe(c2);
      });

      it('cell should return null for unconnected ports', () => {
        const c1 = new Cell('c1', 4);
        const queryService = new TopologyQueryService();

        const neighbor = queryService.getNeighborCell(c1, 0);
        expect(neighbor).toBeNull();
      });

      it('cell should not execute routing logic on query', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.connectPorts(c1, 2, c2, 0);

        // Query should be a simple lookup, no routing
        const queryService = new TopologyQueryService();
        const spy = jest.spyOn(queryService, 'getNeighborCell');

        queryService.getNeighborCell(c1, 2);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(c1, 2);
      });
    });

    describe('Scenario: La asimetría bidireccional se mantiene sincronizada', () => {
      it('bidirectional connection should be symmetric', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 4);
        const cellB = new Cell('cB', 4);

        board.addCell(cellA);
        board.addCell(cellB);

        board.connectPorts(cellA, 1, cellB, 2);

        const queryService = new TopologyQueryService();

        // Forward query
        const neighborFromA = queryService.getNeighborCell(cellA, 1);
        expect(neighborFromA).toBe(cellB);

        // Reverse query
        const neighborFromB = queryService.getNeighborCell(cellB, 2);
        expect(neighborFromB).toBe(cellA);

        // Verify both paths work
        expect(neighborFromA?.getNeighborAtPort(2)).toBe(cellA);
        expect(neighborFromB?.getNeighborAtPort(1)).toBe(cellB);
      });

      it('should maintain symmetry with different port indices', () => {
        const board = new Board('board1');
        const cellA = new Cell('cA', 6);
        const cellB = new Cell('cB', 6);

        board.addCell(cellA);
        board.addCell(cellB);

        board.connectPorts(cellA, 3, cellB, 1);

        const queryService = new TopologyQueryService();

        expect(queryService.getNeighborCell(cellA, 3)).toBe(cellB);
        expect(queryService.getNeighborCell(cellB, 1)).toBe(cellA);
      });
    });

    describe('Additional: TopologyQueryService queries', () => {
      it('should identify exits correctly', () => {
        const queryService = new TopologyQueryService();
        const cell = new Cell('c1', 4);

        expect(queryService.isExit(cell, 0)).toBe(true);
        expect(queryService.isExit(cell, 1)).toBe(true);
      });

      it('should return adjacent cells', () => {
        const board = new Board('board1');
        const c1 = new Cell('c1', 4);
        const c2 = new Cell('c2', 4);
        const c3 = new Cell('c3', 4);

        board.addCell(c1);
        board.addCell(c2);
        board.addCell(c3);

        board.connectPorts(c1, 1, c2, 2);
        board.connectPorts(c1, 3, c3, 0);

        const queryService = new TopologyQueryService();
        const adjacent = queryService.getAdjacentCells(c1);

        expect(adjacent.length).toBe(2);
        expect(adjacent).toContain(c2);
        expect(adjacent).toContain(c3);
      });

      it('should return empty adjacent cells for isolated cell', () => {
        const queryService = new TopologyQueryService();
        const cell = new Cell('c1', 4);

        const adjacent = queryService.getAdjacentCells(cell);
        expect(adjacent).toEqual([]);
      });
    });
  });

  // ══════════════════════════════════════════════
  // TOPOLOGY VALIDATOR TESTS
  // ══════════════════════════════════════════════

  describe('TopologyValidator', () => {
    it('should validate even port counts', () => {
      expect(() => TopologyValidator.validateEvenPortCount(4)).not.toThrow();
      expect(() => TopologyValidator.validateEvenPortCount(6)).not.toThrow();
      expect(() => TopologyValidator.validateEvenPortCount(5)).toThrow('TopologyError: port count must be an even number');
    });

    it('should validate port indices in range', () => {
      expect(() => TopologyValidator.validatePortIndex(0, 4)).not.toThrow();
      expect(() => TopologyValidator.validatePortIndex(3, 4)).not.toThrow();
      expect(() => TopologyValidator.validatePortIndex(4, 4)).toThrow('TopologyError: port index out of range');
      expect(() => TopologyValidator.validatePortIndex(-1, 4)).toThrow('TopologyError: port index out of range');
    });

    it('should validate no self-connect', () => {
      const cellA = new Cell('cA', 4);
      const cellB = new Cell('cB', 4);

      expect(() => TopologyValidator.validateNoSelfConnect(cellA, cellA)).toThrow(
        'ConnectionError: a cell cannot connect to itself'
      );
      expect(() => TopologyValidator.validateNoSelfConnect(cellA, cellB)).not.toThrow();
    });
  });
});
