import { Cell } from './Cell';
import { TopologyValidator } from '../services/TopologyValidator';
import { BoardRegistryError, BoardMutationError } from '../errors/BoardErrors';

/**
 * Board - Domain Entity acting as the passive container for the graph topology.
 *
 * Board is responsible for:
 * - Maintaining a registry of Cells (by ID)
 * - Orchestrating bidirectional port connections and disconnections
 * - Enforcing structural invariants (no self-connect, no port reuse, no duplicate IDs)
 * - Cascading isolation when a Cell is removed
 *
 * Board intentionally does NOT:
 * - Route paths or calculate trajectories
 * - Know about Arrow entities or game logic
 */
export class Board {
  private readonly id: string;
  private readonly cells: Map<string, Cell> = new Map();

  constructor(id: string) {
    this.id = id;
  }

  // ─────────────────────────────────────────────
  // ACCESSORS
  // ─────────────────────────────────────────────

  getId(): string {
    return this.id;
  }

  getAllCells(): Cell[] {
    return Array.from(this.cells.values());
  }

  getCell(id: string): Cell | undefined {
    return this.cells.get(id);
  }

  // ─────────────────────────────────────────────
  // CELL REGISTRY
  // ─────────────────────────────────────────────

  /**
   * Register a Cell in this Board.
   * Throws BoardRegistryError if a Cell with the same ID already exists.
   */
  addCell(cell: Cell): void {
    if (this.cells.has(cell.getId())) {
      throw new BoardRegistryError('cell ID already exists in this board');
    }
    this.cells.set(cell.getId(), cell);
  }

  /**
   * Remove a Cell from this Board.
   * Cascades isolation to all neighbor Cells (their ports become exits again).
   * Throws BoardMutationError if the Cell is currently occupied.
   */
  removeCell(cellId: string): void {
    const cell = this.cells.get(cellId);
    if (!cell) return;

    if (cell.isOccupied()) {
      throw new BoardMutationError('cannot remove an occupied cell');
    }

    // Cascade isolation: for every connected port on this cell,
    // sever the connection on the neighbor side as well.
    const portCount = cell.getPortCount();
    for (let portIndex = 0; portIndex < portCount; portIndex++) {
      const neighbor = cell.getNeighborAtPort(portIndex);
      if (neighbor) {
        const neighborPortIndex = cell._getNeighborPortIndex(portIndex);
        if (neighborPortIndex !== null) {
          neighbor._disconnectFromNeighbor(neighborPortIndex);
        }
        cell._disconnectFromNeighbor(portIndex);
      }
    }

    this.cells.delete(cellId);
  }

  // ─────────────────────────────────────────────
  // CONNECTION MANAGEMENT
  // ─────────────────────────────────────────────

  /**
   * Create a bidirectional connection between two ports on different Cells.
   *
   * Validates:
   * 1. No self-connection (cellA !== cellB)
   * 2. Source port is free (not already connected)
   * 3. Target port is free (not already connected)
   * 4. Port indices are in range (delegated to Cell)
   */
  connectPorts(
    cellA: Cell, portIndexA: number,
    cellB: Cell, portIndexB: number,
  ): void {
    TopologyValidator.validateNoSelfConnect(cellA, cellB);
    TopologyValidator.validatePortIndex(portIndexA, cellA.getPortCount());
    TopologyValidator.validatePortIndex(portIndexB, cellB.getPortCount());

    // _connectToNeighbor throws ConnectionError if the port is already occupied.
    cellA._connectToNeighbor(portIndexA, cellB, portIndexB);
    cellB._connectToNeighbor(portIndexB, cellA, portIndexA);
  }

  /**
   * Sever the connection starting from a specific port.
   * Finds the other side of the connection and frees both ports.
   */
  disconnectPort(cell: Cell, portIndex: number): void {
    const neighbor = cell.getNeighborAtPort(portIndex);
    const neighborPortIndex = cell._getNeighborPortIndex(portIndex);

    cell._disconnectFromNeighbor(portIndex);

    if (neighbor && neighborPortIndex !== null) {
      neighbor._disconnectFromNeighbor(neighborPortIndex);
    }
  }
}

