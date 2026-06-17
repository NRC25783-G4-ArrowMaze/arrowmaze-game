import { Cell } from './Cell';
import { Head } from './Head';
import { Segment } from './Segment';
import { ArrowSegment } from './ArrowSegment';
import { ArrowCreationError, ArrowPlacementError, ArrowCinematicError } from '../errors/ArrowErrors';
import type { AdvanceResult, AdvanceOutcome } from '../value-objects/AdvanceResult';

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
 * - Evaluate and execute its own cinematic trajectory on advance()
 *
 * The Arrow is the ONLY entity allowed to call Cell.placeArrowSegment() and
 * Cell.removeArrowSegment(). Cell is a passive container; all topological
 * validation lives here.
 *
 * ─── IN-FLIGHT INVARIANT ───────────────────────────────────────────────────
 * While _inFlight === true, the segment chain is locked. Any external call to
 * extend() will throw ArrowCinematicError. The flag is managed atomically by
 * advance() using a try/finally block.
 * ───────────────────────────────────────────────────────────────────────────
 */
export class Arrow {
  /**
   * Private backing field for the head segment.
   * Reassigned during advance() when the head moves to a new cell.
   * Exposed read-only via the `head` getter.
   */
  private _head: Head;

  /**
   * In-flight flag. When true, the segment chain is locked against
   * external structural mutations (extend, partial destroy).
   */
  private _inFlight: boolean = false;

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

    this._head = new Head(headCell, exitPort);
    headCell.placeArrowSegment({ isHead: true, cellId: headCell.getId() });
  }

  // ─────────────────────────────────────────────
  // ACCESSORS
  // ─────────────────────────────────────────────

  /**
   * The first node of the linked list. Always a Head segment.
   * Read-only from external consumers; reassigned internally by advance().
   */
  get head(): Head {
    return this._head;
  }

  /**
   * Number of segments in the arrow (Head + all body Segments).
   * Traverses the full chain — O(n).
   */
  get length(): number {
    let count = 0;
    let current: ArrowSegment | null = this._head;
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
   * 1. Not currently in-flight (ArrowCinematicError)
   * 2. nextCell is physically connected to the tail's cell
   * 3. nextCell is not already occupied by a different entity
   * 4. nextCell is not occupied by THIS arrow (self-collision)
   *
   * Then calculates the new segment's entryPort:
   * - portFromTailToNext: the port index on tail.cell that connects to nextCell
   * - entryPort of new segment: (portFromTailToNext + portCount/2) mod portCount
   *
   * @param nextCell - The cell the new Segment will occupy
   * @throws {ArrowCinematicError} if called during an in-flight transaction
   * @throws {ArrowPlacementError} on connectivity, occupancy, or self-collision violations
   */
  extend(nextCell: Cell): void {
    if (this._inFlight) {
      throw new ArrowCinematicError('immutable segment chain during flight transaction');
    }

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
    const entryPort = (portFromTailToNext + portCount / 2) % portCount;

    // ── 4. Create and link new segment ─────────
    const newSegment = new Segment(nextCell, entryPort);
    newSegment.prev = tail;
    tail.next = newSegment;

    // ── 5. Notify cell ─────────────────────────
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
    let current: ArrowSegment | null = this._head;
    while (current !== null) {
      current.cell.removeArrowSegment();
      current = current.next;
    }
  }

  // ─────────────────────────────────────────────
  // MOVEMENT — CINEMATIC ENGINE
  // ─────────────────────────────────────────────

  /**
   * Execute one movement tick (advance).
   *
   * The algorithm follows a 4-phase Head-push model:
   *
   * Phase 1 — Collect: Linearize the linked list into an ordered array.
   * Phase 2 — Project: For each segment, compute exitDir and targetCell.
   * Phase 3 — Validate: Lazy collision check on the head's target only.
   * Phase 4 — Commit:  Release old cells, reconstruct chain in new cells.
   *
   * Invariant: In each tick, exactly 1 node is claimed (by the head) and
   * 1 node is released (by the tail). Exception: if the tail flows to an
   * exit, the arrow shortens by 1 (0 claimed, 2+ released).
   *
   * @returns AdvanceResult describing the outcome and affected cells
   */
  advance(): AdvanceResult {
    this._inFlight = true;

    try {
      // ── Phase 1: Collect chain ─────────────────
      const chain = this._collectChain();

      // ── Phase 2: Project targets ───────────────
      const targets = this._calculateTargets(chain);

      // ── Phase 3: Validate head's target ────────
      const headTarget = targets[0];
      const headTargetCell = headTarget.targetCell;

      // HEAD exits to a sink → destroy
      if (headTargetCell === null) {
        const freedCellIds = chain.map(s => s.cell.getId());
        this.destroy();
        return { outcome: 'destroyed', freedCellIds, occupiedCellIds: [] };
      }

      // HEAD hits a foreign entity → blocked (rollback = do nothing)
      if (headTargetCell.isOccupied() && !this._cellBelongsToSelf(headTargetCell)) {
        return { outcome: 'blocked', freedCellIds: [], occupiedCellIds: [] };
      }

      // ── Phase 4: Commit advance ────────────────
      return this._commitAdvance(chain, targets);

    } finally {
      this._inFlight = false;
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE — CINEMATIC HELPERS
  // ─────────────────────────────────────────────

  /**
   * Linearize the doubly-linked chain into an ordered array [head, ..., tail].
   * O(n).
   */
  private _collectChain(): ArrowSegment[] {
    const chain: ArrowSegment[] = [];
    let current: ArrowSegment | null = this._head;
    while (current !== null) {
      chain.push(current);
      current = current.next;
    }
    return chain;
  }

  /**
   * For each segment in the chain, compute:
   * - exitDir: the port index on the current cell through which this segment will exit.
   * - targetCell: the neighboring cell in that direction, or null if it's an exit (sink).
   *
   * Exit direction logic:
   * - Head:        uses head.exitPort directly (the stored directional intent).
   * - Body (has next): the port on current cell that connects to next.cell.
   * - Tail (no next):  opposite port of entryPort → (entryPort + P/2) % P.
   *
   * Note: Body uses the "port toward next" formula, NOT the opposite-port formula.
   * This correctly resolves dynamic curves where the body changes direction.
   */
  private _calculateTargets(
    chain: ArrowSegment[]
  ): Array<{ segment: ArrowSegment; exitDir: number; targetCell: Cell | null }> {
    return chain.map((segment, i) => {
      let exitDir: number;

      if (segment instanceof Head) {
        exitDir = segment.exitPort;
      } else if (i < chain.length - 1) {
        // Body segment — exit toward the next segment's current cell
        const nextSeg = chain[i + 1];
        const port = this._findConnectingPort(segment.cell, nextSeg.cell);
        if (port === null) {
          throw new ArrowCinematicError(
            `corrupted segment chain — body segment at ${segment.cell.getId()} has no path to next segment at ${nextSeg.cell.getId()}`
          );
        }
        exitDir = port;
      } else {
        // Tail segment — exit through opposite of entry port
        const seg = segment as Segment;
        const portCount = segment.cell.getPortCount();
        exitDir = (seg.entryPort + portCount / 2) % portCount;
      }

      const targetCell = segment.cell.getNeighborAtPort(exitDir);
      return { segment, exitDir, targetCell };
    });
  }

  /**
   * Commit the advance: release old cell occupations, rebuild the chain
   * in the new cell positions, update _head.
   *
   * Returns the AdvanceResult describing which cells were freed and occupied.
   */
  private _commitAdvance(
    chain: ArrowSegment[],
    targets: Array<{ segment: ArrowSegment; exitDir: number; targetCell: Cell | null }>
  ): AdvanceResult {
    const outcome: AdvanceOutcome = 'advanced';
    const freedCellIds: string[] = [];
    const occupiedCellIds: string[] = [];
    const portCount = chain[0].cell.getPortCount();

    // ── Step A: Release all old cell occupations ─
    for (const seg of chain) {
      seg.cell.removeArrowSegment();
      freedCellIds.push(seg.cell.getId());
    }

    // ── Step B: Build new segments in target cells ─
    // Segments whose targetCell is null (exit/sink) are purged (not added to new chain).
    const newSegments: ArrowSegment[] = [];

    for (let i = 0; i < targets.length; i++) {
      const { exitDir, targetCell } = targets[i];

      if (targetCell === null) {
        // This segment flows into a sink — it is purged
        continue;
      }

      if (i === 0) {
        // Rebuild head in new cell
        // New head's exitPort: if body exists, it's the port toward the next surviving segment's new cell.
        // We'll fix exitPort after building the full array; for now use exitDir as a placeholder.
        const newHead = new Head(targetCell, exitDir);
        newSegments.push(newHead);
      } else {
        // Rebuild body/tail segment in new cell.
        // entryPort of new segment = opposite of the port on the PREVIOUS SEGMENT'S NEW CELL
        // that connects to THIS segment's new cell.
        //
        // Example (curve): prev new cell = C1b, this new cell = C2b.
        //   C1b[port2] → C2b[port0], so the prev exits via port2.
        //   entryPort of this segment = (2 + P/2) % P = 0. ✓
        const prevTargetCell = targets[i - 1].targetCell!;
        const exitDirFromPrevToThis = this._findConnectingPort(prevTargetCell, targetCell);
        if (exitDirFromPrevToThis === null) {
          throw new ArrowCinematicError(
            `cannot reconstruct chain — no connection from ${prevTargetCell.getId()} to ${targetCell.getId()}`
          );
        }
        const entryPort = (exitDirFromPrevToThis + portCount / 2) % portCount;
        const newSeg = new Segment(targetCell, entryPort);
        newSegments.push(newSeg);
      }
    }

    // ── Step C: Recalculate head's exitPort ──────
    // The head's exitPort after advance = the port on its new cell that leads
    // toward the next surviving segment's new cell.
    // If the head is alone (single-head), exitPort = opposite of its entryPort in new cell.
    if (newSegments.length > 0 && newSegments[0] instanceof Head) {
      const newHead = newSegments[0];
      if (newSegments.length > 1) {
        const nextSeg = newSegments[1];
        const portToNext = this._findConnectingPort(newHead.cell, nextSeg.cell);
        if (portToNext !== null) {
          // Reconstruct Head with correct exitPort
          newSegments[0] = new Head(newHead.cell, portToNext);
        }
        // If portToNext is null, the segment was just built so this shouldn't happen.
        // We keep the exitDir placeholder in that edge case.
      } else {
        // Single head: exitPort = the direction it came from (the original exitDir)
        // which is already set correctly in the Head constructor above.
        // No recalculation needed for single-head case.
      }
    }

    // ── Step D: Link new chain as doubly-linked list ─
    for (let i = 0; i < newSegments.length; i++) {
      newSegments[i].prev = i > 0 ? newSegments[i - 1] : null;
      newSegments[i].next = i < newSegments.length - 1 ? newSegments[i + 1] : null;
    }

    // ── Step E: Register occupation in new cells ─
    for (const seg of newSegments) {
      seg.cell.placeArrowSegment({ isHead: seg.isHead, cellId: seg.cell.getId() });
      occupiedCellIds.push(seg.cell.getId());
    }

    // ── Step F: Update _head (or destroy if chain is empty) ─
    if (newSegments.length === 0) {
      // Arrow fully consumed (all segments flowed to sinks)
      return { outcome: 'destroyed', freedCellIds, occupiedCellIds: [] };
    }

    this._head = newSegments[0] as Head;

    return { outcome, freedCellIds, occupiedCellIds };
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS (placement)
  // ─────────────────────────────────────────────

  /** Traverse the chain to find the last segment. O(n). */
  private _getTail(): ArrowSegment {
    let current: ArrowSegment = this._head;
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
    let current: ArrowSegment | null = this._head;
    while (current !== null) {
      if (current.cell === cell) {
        return true;
      }
      current = current.next;
    }
    return false;
  }
}
