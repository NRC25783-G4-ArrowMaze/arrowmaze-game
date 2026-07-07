import { ArrowSegment } from '../../domain/entities/ArrowSegment';
import { Head } from '../../domain/entities/Head';
import { Segment } from '../../domain/entities/Segment';
import type { ArrowSegmentDTO } from '../dtos/ArrowDTOs';
import type { AdvanceArrowInput, AdvanceResultDTO } from '../dtos/MovementDTOs';

/**
 * AdvanceArrowUseCase — Application use case for executing one movement tick on an Arrow.
 *
 * Orchestrates a single advance tick:
 * 1. Delegate to Arrow.advance() (all domain logic lives in the entity)
 * 2. Map the domain AdvanceResult to an AdvanceResultDTO
 * 3. Project the post-tick segment chain into ArrowSegmentDTOs
 * 4. Return a safe, typed result to the caller (UI, controller, etc.)
 *
 * This use case contains NO business logic — it is a pure orchestration boundary.
 * All movement rules, collision checks, and rollback logic live in Arrow (domain).
 *
 * Note: One invocation = one arrow, one tick. Orchestrating multiple arrows
 * or managing turn order is the responsibility of a higher-level coordinator
 * (future feature, out of scope).
 */
export class AdvanceArrowUseCase {
  /**
   * Execute one movement tick on the given arrow.
   *
   * @param input - Contains the Arrow to advance and the Board (for context).
   * @returns AdvanceResultDTO describing the outcome and affected state.
   */
  execute(input: AdvanceArrowInput): AdvanceResultDTO {
    const { arrow } = input;

    try {
      // ── Delegate tick to domain entity ─────────
      const domainResult = arrow.advance();

      // ── Project chain after tick ────────────────
      // On 'destroyed', the arrow's cells are all freed — project an empty chain.
      const segments: ArrowSegmentDTO[] =
        domainResult.outcome === 'destroyed'
          ? []
          : this._projectChain(arrow.head);

      const arrowLength =
        domainResult.outcome === 'destroyed' ? 0 : arrow.length;

      return {
        success: true,
        outcome: domainResult.outcome,
        segments,
        freedCellIds: [...domainResult.freedCellIds],
        occupiedCellIds: [...domainResult.occupiedCellIds],
        arrowLength,
      };
    } catch (err: unknown) {
      // Unexpected domain error (e.g. ArrowCinematicError, corrupted chain).
      // Surface as a failed result so the caller can handle it gracefully.
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        outcome: 'blocked', // Safe default — no mutation occurred
        segments: [],
        freedCellIds: [],
        occupiedCellIds: [],
        arrowLength: 0,
        error: message,
      };
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Traverse the linked list from head and project each node to a DTO.
   * Mirrors PlaceArrowUseCase._projectChain() — same projection logic.
   */
  private _projectChain(head: ArrowSegment): ArrowSegmentDTO[] {
    const result: ArrowSegmentDTO[] = [];
    let current: ArrowSegment | null = head;

    while (current !== null) {
      if (current instanceof Head) {
        result.push({
          cellId: current.getCellId(),
          isHead: true,
          exitPort: current.exitPort,
          entryPort: null,
        });
      } else {
        const seg = current as Segment;
        result.push({
          cellId: seg.getCellId(),
          isHead: false,
          exitPort: null,
          entryPort: seg.entryPort,
        });
      }
      current = current.next;
    }

    return result;
  }
}
