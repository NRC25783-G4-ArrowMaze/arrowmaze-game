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
 * - portCount must be even and immutable
 * - All ports start as exits (no neighbors)
 * - Ports can only be connected via Board.connectPorts()
 * - Each port can connect to at most one neighbor
 * - Connections must be bidirectional
 */
export class Cell {
  private readonly id: string;
  private readonly portCount: number;
  private readonly ports: Port[];
  private readonly connections: Map<number, { neighborCell: Cell; neighborPortIndex: number }> = new Map();
  
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
    
    // Create immutable ports array
    this.ports = Object.freeze(
      Array.from({ length: portCount }, (_, i) => new Port(i))
    );

    // Freeze port objects
    this.ports.forEach(port => Object.freeze(port));

    // Freeze this cell's properties
    Object.freeze(this);
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
   * Get the neighbor cell at a specific port index
   * Returns null if the port is an exit (no neighbor)
   */
  getNeighborAtPort(portIndex: number): Cell | null {
    const connection = this.connections.get(portIndex);
    return connection ? connection.neighborCell : null;
  }

  /**
   * Check if a port is an exit (no neighbor connected)
   */
  isExit(portIndex: number): boolean {
    if (portIndex < 0 || portIndex >= this.portCount) {
      throw new Error(`TopologyError: port index out of range`);
    }
    return !this.connections.has(portIndex);
  }

  /**
   * Check if a port can be connected (is currently an exit)
   */
  canConnect(portIndex: number): boolean {
    return this.isExit(portIndex);
  }

  /**
   * Get the neighbor port index (if connected)
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
   * Internal: Connect this port to a neighbor cell at a specific neighbor port index
   * Called only by Board during connection operations
   */
  _connectToNeighbor(portIndex: number, neighborCell: Cell, neighborPortIndex: number): void {
    if (!this.canConnect(portIndex)) {
      throw new Error(`ConnectionError: port ${portIndex} of cell ${this.id} is already occupied`);
    }
    this.connections.set(portIndex, {
      neighborCell,
      neighborPortIndex,
    });
  }

  /**
   * Internal: Disconnect a port and revert to exit state
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
   * Place an arrow segment on this cell
   * - Head segments can only be placed on isolated cells or as start of a chain
   * - Body segments require at least two connected cells
   */
  placeArrowSegment(segment: { isHead: boolean; cellId: string }): void {
    if (!segment.isHead) {
      // Body segment requires at least 2 connected ports
      const connectedPorts = Array.from(this.connections.keys());
      if (connectedPorts.length < 2) {
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
