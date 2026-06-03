import { Cell } from './Cell';
import { Head } from './Head';
import { Segment } from './Segment';
import { ArrowSegment } from './ArrowSegment';
import { ArrowCreationError, ArrowPlacementError } from '../errors/ArrowErrors';

/**
 * Arrow — Active domain entity representing the arrow piece on the board.
 *
 * Internally structured as a doubly-linked list of ArrowSegments:
 *   head (Head) → Segment → Segment → ... → tail (Segment, next = null)
 *
 * Responsibilities:
 * - Validate topology before placing each segment (connectivity, occupancy, self-collision)
 * - Calculate fromPort / toPort for each Segment using the passive graph's adjacency
 * - Notify each Cell of its occupation via Cell.placeArrowSegment()
 * - Clean up all Cell references on destruction via destroy()
 *
 * The Arrow is the ONLY entity allowed to call Cell.placeArrowSegment() and
 * Cell.removeArrowSegment(). Cell is a passive container; all topological
 * validation lives here.
 */
export class Arrow {
  /** First node of the linked list. Always a Head segment. */
  readonly head: Head;

  /**
   * Creates a new Arrow with a single Head segment on the given cell.
   *
   * @param headCell - The cell the head will occupy
   * @param exitPort - The port index representing the arrow's intended travel direction.
   *                   Must be provided explicitly; omitting it is a domain error.
   * @throws {ArrowCreationError} if exitPort is null or undefined
   */
  constructor(headCell: Cell, exitPort: number) {
    if (exitPort === null || exitPort === undefined) {
      throw new ArrowCreationError('head segment requires an explicit exitPort intent');
    }

    this.head = new Head(headCell, exitPort);
    headCell.placeArrowSegment({ isHead: true, cellId: headCell.getId() });
  }

  // ─────────────────────────────────────────────
  // ACCESSORS
  // ─────────────────────────────────────────────

  /**
   * Number of segments in the arrow (Head + all body Segments).
   * Traverses the full chain — O(n).
   */
  get length(): number {
    let count = 0;
    let current: ArrowSegment | null = this.head;
    while (current !== null) {
      count++;
      current = current.next;
    }
    return count;
  }

  // ─────────────────────────────────────────────
  // PLACEMENT
  // ─────────────────────────────────────────────

  /**
   * Extend the arrow by appending a new Segment at the end of the chain.
   *
   * Validates (in order):
   * 1. nextCell is physically connected to the tail's cell
   * 2. nextCell is not already occupied by a different entity
   * 3. nextCell is not occupied by THIS arrow (self-collision)
   *
   * Then calculates ports:
   * - portFromTailToNext: the port index on tail.cell that connects to nextCell
   * - fromPort of new segment: (portFromTailToNext + portCount/2) mod portCount
   * - toPort of tail: portFromTailToNext (set retrospectively)
   *
   * @param nextCell - The cell the new Segment will occupy
   * @throws {ArrowPlacementError} on connectivity, occupancy, or self-collision violations
   */
  extend(nextCell: Cell): void {
    const tail = this._getTail();

    // ── 1. Connectivity check ──────────────────
    const portFromTailToNext = this._findConnectingPort(tail.cell, nextCell);
    if (portFromTailToNext === null) {
      throw new ArrowPlacementError(
        `cell ${nextCell.getId()} is not physically connected to previous cell ${tail.cell.getId()}`
      );
    }

    // ── 2. Occupancy check (different entity) ──
    if (nextCell.isOccupied()) {
      // Distinguish self-collision from foreign-entity collision
      if (this._cellBelongsToSelf(nextCell)) {
        throw new ArrowPlacementError(
          `structural collision, cell ${nextCell.getId()} is occupied by self`
        );
      }
      throw new ArrowPlacementError(
        `cell ${nextCell.getId()} is already occupied by a different entity`
      );
    }

    // ── 3. Port arithmetic ─────────────────────
    const portCount = tail.cell.getPortCount();
    const fromPort = (portFromTailToNext + portCount / 2) % portCount;

    // ── 4. Update tail's toPort (retrospective) ─
    tail.toPort = portFromTailToNext;

    // ── 5. Create and link new segment ─────────
    const newSegment = new Segment(nextCell);
    newSegment.fromPort = fromPort;
    newSegment.prev = tail;
    tail.next = newSegment;

    // ── 6. Notify cell ─────────────────────────
    nextCell.placeArrowSegment({ isHead: false, cellId: nextCell.getId() });
  }

  // ─────────────────────────────────────────────
  // DESTRUCTION
  // ─────────────────────────────────────────────

  /**
   * Destroy the arrow, releasing all Cell occupation references.
   * After calling destroy(), this Arrow instance should not be reused.
   */
  destroy(): void {
    let current: ArrowSegment | null = this.head;
    while (current !== null) {
      current.cell.removeArrowSegment();
      current = current.next;
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /** Traverse the chain to find the last segment. O(n). */
  private _getTail(): ArrowSegment {
    let current: ArrowSegment = this.head;
    while (current.next !== null) {
      current = current.next;
    }
    return current;
  }

  /**
   * Find the port index on `fromCell` that connects to `toCell`.
   * Returns null if no such connection exists.
   */
  private _findConnectingPort(fromCell: Cell, toCell: Cell): number | null {
    const portCount = fromCell.getPortCount();
    for (let portIndex = 0; portIndex < portCount; portIndex++) {
      const neighbor = fromCell.getNeighborAtPort(portIndex);
      if (neighbor === toCell) {
        return portIndex;
      }
    }
    return null;
  }

  /**
   * Check if a given cell is already occupied by a segment in this arrow's chain.
   * Used to distinguish self-collision from foreign-entity collision.
   * O(n).
   */
  private _cellBelongsToSelf(cell: Cell): boolean {
    let current: ArrowSegment | null = this.head;
    while (current !== null) {
      if (current.cell === cell) {
        return true;
      }
      current = current.next;
    }
    return false;
  }
}
