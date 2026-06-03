import { Cell } from './Cell';
import { ArrowSegment } from './ArrowSegment';

/**
 * Segment — A body segment of the Arrow linked list.
 *
 * Invariants enforced at construction time:
 * - isHead = false    (constant)
 * - exitPort = null   (direction intent is exclusive to Head)
 *
 * fromPort and toPort are null at construction and are assigned by
 * Arrow.extend() as the chain is assembled:
 * - fromPort: set when this Segment is added (computed from predecessor's port)
 * - toPort:   set when the NEXT Segment after this one is added
 *
 * next = null until Arrow.extend() appends a following segment.
 * prev is set by Arrow.extend() when this segment is linked into the chain.
 */
export class Segment extends ArrowSegment {
  readonly isHead = false as const;
  readonly exitPort = null;

  constructor(cell: Cell) {
    super(cell);
  }
}
