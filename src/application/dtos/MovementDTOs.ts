import type { Arrow } from '../../domain/entities/Arrow';
import type { Board } from '../../domain/entities/Board';
import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';
import type { ArrowSegmentDTO } from './ArrowDTOs';

/**
 * Input DTO for AdvanceArrowUseCase.
 *
 * The Arrow and Board are passed directly (already in memory).
 * The use case does not perform any IO — it is a pure in-memory orchestration.
 */
export interface AdvanceArrowInput {
  /** The board on which the arrow is moving (used for context; not mutated by the use case). */
  board: Board;
  /** The arrow instance to advance. Must be an active, non-destroyed Arrow. */
  arrow: Arrow;
}

/**
 * Output DTO for AdvanceArrowUseCase.
 *
 * Transports the result of a single movement tick to external consumers (e.g. UI layer).
 *
 * Outcomes:
 * - 'advanced':  Arrow moved forward. segments reflects the new chain state.
 * - 'blocked':   Arrow could not advance (occupied target). State is unchanged.
 * - 'destroyed': Arrow reached an exit (sink). Arrow is gone; segments is empty.
 *
 * Cell tracking (for animation hints to the UI):
 * - freedCellIds:    Cells released during this tick (play "vacate" animation).
 * - occupiedCellIds: Cells newly claimed during this tick (play "enter" animation).
 */
export interface AdvanceResultDTO {
  /** Whether the tick was processed without errors. */
  success: boolean;
  /** The outcome of the advance tick. */
  outcome: AdvanceOutcome;
  /**
   * Snapshot of the arrow's segment chain AFTER the tick.
   * Empty when outcome === 'destroyed'.
   */
  segments: ArrowSegmentDTO[];
  /** IDs of cells released during this tick. Empty on 'blocked'. */
  freedCellIds: string[];
  /** IDs of cells newly occupied during this tick. Empty on 'blocked' and 'destroyed'. */
  occupiedCellIds: string[];
  /** Total length of the arrow after the tick. 0 when outcome === 'destroyed'. */
  arrowLength: number;
  /** Present only when success === false (unexpected domain error). */
  error?: string;
}
