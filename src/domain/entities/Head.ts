import { Cell } from './Cell';
import { ArrowSegment } from './ArrowSegment';

/**
 * Head — The motor segment of the Arrow linked list.
 *
 * Invariants enforced at construction time:
 * - isHead = true  (constant, never overridable)
 * - prev = null    (Head is always the list's first node; no predecessor)
 * - exitPort must be provided (defines the arrow's intended direction of travel)
 *
 * Head does NOT have an entryPort — it has no predecessor cell.
 * exitPort is NOT validated against the cell's portCount here; that
 * responsibility belongs to the Arrow entity which has full context.
 */
export class Head extends ArrowSegment {
  readonly isHead = true as const;

  /**
   * The port on the head's cell through which the arrow intends to exit.
   * Defines the arrow's directional intent before movement begins.
   * Exclusive to Head — Segment instances have entryPort instead.
   */
  readonly exitPort: number;

  constructor(cell: Cell, exitPort: number) {
    super(cell);
    this.exitPort = exitPort;
  }
}
