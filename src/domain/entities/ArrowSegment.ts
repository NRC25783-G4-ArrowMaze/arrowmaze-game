import { Cell } from './Cell';

/**
 * ArrowSegment — Abstract base class for nodes in the Arrow linked list.
 *
 * Each segment occupies one Cell and participates in a doubly-linked chain:
 *   Head → Segment → Segment → ... → tail (Segment with next = null)
 *
 * Responsibilities:
 * - Hold a reference to the occupied Cell
 * - Participate in the doubly-linked list via prev / next
 *
 * Each subclass owns only what belongs to it:
 * - Head: has exitPort (directional intent). No entry port — it has no predecessor.
 * - Segment: has entryPort (the port through which it was entered). Nothing else.
 */
export abstract class ArrowSegment {
  /** The passive cell this segment occupies. */
  readonly cell: Cell;

  /** Previous segment in the chain. Always null for Head. */
  prev: ArrowSegment | null = null;

  /** Next segment in the chain. null when this segment is the tail. */
  next: ArrowSegment | null = null;

  /** True only for the Head segment. Used as a type discriminator. */
  abstract readonly isHead: boolean;

  constructor(cell: Cell) {
    this.cell = cell;
  }

  /** Delegates to the occupied cell's identifier. */
  getCellId(): string {
    return this.cell.getId();
  }
}
