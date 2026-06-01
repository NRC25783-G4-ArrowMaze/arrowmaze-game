/**
 * Port - Value Object representing a single port on a Cell
 * 
 * A Port is an immutable point of connection with optional reference to a neighbor.
 * Each port can either be:
 * - An exit (no neighbor connected)
 * - Connected to exactly one neighbor cell at a specific neighbor port index
 */
export class Port {
  private readonly index: number;
  private neighborCell: any | null = null; // Cell or null
  private neighborPortIndex: number | null = null;

  constructor(index: number) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error('Port index must be a non-negative integer');
    }
    this.index = index;
    Object.freeze(this);
  }

  getIndex(): number {
    return this.index;
  }

  getNeighborCell(): any | null {
    return this.neighborCell;
  }

  getNeighborPortIndex(): number | null {
    return this.neighborPortIndex;
  }

  /**
   * Check if this port is an exit (not connected to any neighbor)
   */
  isExit(): boolean {
    return this.neighborCell === null;
  }

  /**
   * Internal: Connect this port to a neighbor (only called by Cell during Board operations)
   * This mutates the port but only before it's exposed to the public API.
   */
  _connectToNeighbor(neighborCell: any, neighborPortIndex: number): void {
    if (!Object.isFrozen(this)) {
      this.neighborCell = neighborCell;
      this.neighborPortIndex = neighborPortIndex;
    } else {
      throw new Error('Cannot modify frozen port');
    }
  }

  /**
   * Internal: Disconnect this port (revert to exit)
   */
  _disconnect(): void {
    if (!Object.isFrozen(this)) {
      this.neighborCell = null;
      this.neighborPortIndex = null;
    } else {
      throw new Error('Cannot modify frozen port');
    }
  }
}
