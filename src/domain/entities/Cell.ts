import { Port } from '../value-objects/Port';

/**
 * Cell - Domain Entity representing a node in the board graph
 * 
 * A Cell is a passive container with a fixed topology defined by an even number of ports.
 * It tracks:
 * - Indexed ports (Port[]) 
 * - Connections to neighbor cells (Map<portIndex, {neighborCell, neighborPortIndex}>)
 * - Occupancy state (arrow segment placement)
 * 
 * INVARIANTS:
 * - portCount must be even and immutable (readonly)
 * - ports array is frozen (cannot push/splice)
 * - Each Port object is frozen (cannot mutate index)
 * - Connections are managed exclusively via Board.connectPorts() / Board.disconnectPort()
 * - Each port connects to at most one neighbor (bijection)
 * - Connections must be bidirectional
 */
export class Cell {
  private readonly id: string;
  private readonly portCount: number;
  private readonly ports: ReadonlyArray<Port>;

  /**
   * Package-private: connection registry.
   * Exposed as `(cell as any).connections` in tests for low-level assertions.
   */
  private readonly connections: Map<number, { neighborCell: Cell; neighborPortIndex: number }>;
  
  // Arrow segment occupation state
  private arrowSegment: { isHead: boolean; cellId: string } | null = null;
  private occupied: boolean = false;

  constructor(id: string, portCount: number) {
    if (!Number.isInteger(portCount) || portCount <= 0) {
      throw new Error('Port count must be a positive integer');
    }
    if (portCount % 2 !== 0) {
      throw new Error('TopologyError: port count must be an even number');
    }

    this.id = id;
    this.portCount = portCount;

    // Each Port is frozen inside its own constructor.
    // We also freeze the array so push/splice throw in strict mode.
    this.ports = Object.freeze(
      Array.from({ length: portCount }, (_, i) => new Port(i))
    );

    this.connections = new Map();

    // Make id and portCount non-writable and non-configurable at the JS runtime level
    // so that `(cell as any).portCount = X` throws in strict mode (Jest runs in strict mode).
    // We cannot use Object.freeze(this) because connections/arrowSegment/occupied must mutate.
    Object.defineProperty(this, 'portCount', {
      value: portCount,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(this, 'id', {
      value: id,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  // ─────────────────────────────────────────────
  // ACCESSORS
  // ─────────────────────────────────────────────

  getId(): string {
    return this.id;
  }

  getPortCount(): number {
    return this.portCount;
  }

  getPortAtIndex(index: number): Port {
    if (index < 0 || index >= this.portCount) {
      throw new Error(`TopologyError: port index out of range [0, ${this.portCount - 1}]`);
    }
    return this.ports[index];
  }

  // ─────────────────────────────────────────────
  // TOPOLOGY QUERIES (PASSIVE)
  // ─────────────────────────────────────────────

  /**
   * Get the neighbor cell at a specific port index.
   * Returns null if the port is an exit (no neighbor).
   */
  getNeighborAtPort(portIndex: number): Cell | null {
    const connection = this.connections.get(portIndex);
    return connection ? connection.neighborCell : null;
  }

  /**
   * Check if a port is an exit (no neighbor connected).
   */
  isExit(portIndex: number): boolean {
    if (portIndex < 0 || portIndex >= this.portCount) {
      throw new Error('TopologyError: port index out of range');
    }
    return !this.connections.has(portIndex);
  }

  /**
   * Check if a port can be connected (is currently an exit).
   */
  canConnect(portIndex: number): boolean {
    return this.isExit(portIndex);
  }

  /**
   * Get the neighbor port index for a connected port.
   */
  _getNeighborPortIndex(portIndex: number): number | null {
    const connection = this.connections.get(portIndex);
    return connection ? connection.neighborPortIndex : null;
  }

  // ─────────────────────────────────────────────
  // CONNECTION MANAGEMENT (PACKAGE-PRIVATE)
  // Only called by Board.connectPorts() and Board.disconnectPort()
  // ─────────────────────────────────────────────

  /**
   * Internal: Register a bidirectional connection for this port.
   * Called exclusively by Board.connectPorts().
   */
  _connectToNeighbor(portIndex: number, neighborCell: Cell, neighborPortIndex: number): void {
    if (!this.canConnect(portIndex)) {
      throw new Error(`ConnectionError: port ${portIndex} of cell ${this.id} is already occupied`);
    }
    this.connections.set(portIndex, { neighborCell, neighborPortIndex });
  }

  /**
   * Internal: Sever the connection on this port (revert to exit).
   * Called exclusively by Board.disconnectPort() and Board.removeCell().
   */
  _disconnectFromNeighbor(portIndex: number): void {
    this.connections.delete(portIndex);
  }

  // ─────────────────────────────────────────────
  // ARROW SEGMENT OCCUPATION
  // ─────────────────────────────────────────────

  hasArrowSegment(): boolean {
    return this.occupied;
  }

  isOccupied(): boolean {
    return this.occupied;
  }

  getArrowSegment(): { isHead: boolean; cellId: string } | null {
    return this.arrowSegment;
  }

  /**
   * Place an arrow segment on this cell.
   * - Head segments can be placed on any cell.
   * - Body segments require at least 2 connected ports.
   */
  placeArrowSegment(segment: { isHead: boolean; cellId: string }): void {
    if (!segment.isHead) {
      if (this.connections.size < 2) {
        throw new Error('ArrowPlacementError: body segment requires at least two connected cells');
      }
    }

    this.arrowSegment = segment;
    this.occupied = true;
  }

  /**
   * Remove arrow segment from this cell
   */
  removeArrowSegment(): void {
    this.arrowSegment = null;
    this.occupied = false;
  }
}
