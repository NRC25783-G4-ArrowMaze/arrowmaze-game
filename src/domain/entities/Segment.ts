import { Cell } from './Cell';
import { ArrowSegment } from './ArrowSegment';

/**
 * Segment — A body segment of the Arrow linked list.
 *
 * Invariants:
 * - isHead = false  (constant)
 * - entryPort is readonly and set at construction time by Arrow.extend()
 *
 * A Segment knows only one thing about its position in the flow:
 * the port through which the arrow entered this cell (entryPort).
 * It does NOT know where the arrow goes next — that is the next
 * Segment's concern, and Arrow's responsibility to traverse.
 *
 * prev / next are set by Arrow.extend() when the chain is assembled.
 */
export class Segment extends ArrowSegment {
  readonly isHead = false as const;

  /**
   * The port index on this cell through which the arrow entered.
   * Computed by Arrow.extend() using opposite-port arithmetic.
   * Example: if the predecessor exited via port 1, entryPort = (1 + portCount/2) % portCount.
   */
  readonly entryPort: number;

  constructor(cell: Cell, entryPort: number) {
    super(cell);
    this.entryPort = entryPort;
  }
}
