import { Cell } from './Cell';

/**
 * ArrowSegment — Abstract base class for nodes in the Arrow linked list.
 *
 * Each segment occupies one Cell passively and participates in a doubly-linked
 * chain: Head → Segment → Segment → ... → tail (Segment with next = null).
 *
 * Responsibilities:
 * - Hold a reference to the occupied Cell
 * - Expose fromPort / toPort (calculated by Arrow during extend())
 * - Participate in the doubly-linked list via prev / next
 *
 * Subclasses:
 * - Head: isHead = true, prev always null, exitPort always non-null, fromPort always null
 * - Segment: isHead = false, exitPort always null
 */
export abstract class ArrowSegment {
  /** The passive cell this segment occupies. */
  readonly cell: Cell;

  /**
   * Port through which this segment was entered from the previous segment.
   * null for Head (has no predecessor).
   * Assigned by Arrow.extend() after linking.
   */
  fromPort: number | null = null;

  /**
   * Port through which this segment exits toward the next segment.
   * null if this segment is the tail (next = null).
   * Assigned by Arrow.extend() when the following segment is linked.
   */
  toPort: number | null = null;

  /** Previous segment in the chain. Always null for Head. */
  prev: ArrowSegment | null = null;

  /** Next segment in the chain. null when this segment is the tail. */
  next: ArrowSegment | null = null;

  /** True only for the Head segment. Used as a type discriminator. */
  abstract readonly isHead: boolean;

  /**
   * Direction intent for future movement.
   * Non-null only for Head segments.
   * null for all body Segment instances.
   */
  abstract readonly exitPort: number | null;

  constructor(cell: Cell) {
    this.cell = cell;
  }

  /** Delegates to the occupied cell's identifier. */
  getCellId(): string {
    return this.cell.getId();
  }
}
