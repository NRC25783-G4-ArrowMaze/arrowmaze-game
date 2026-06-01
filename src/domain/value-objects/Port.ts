/**
 * Port - Value Object representing a single port on a Cell
 *
 * A Port is a purely structural value object that carries only its index.
 * Whether a port is an "exit" or "connected" is determined by Cell's
 * internal `connections` Map — NOT by the Port itself.
 *
 * Invariants:
 * - index is non-negative integer
 * - Port is immutable after construction (frozen)
 */
export class Port {
  private readonly index: number;

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
}
