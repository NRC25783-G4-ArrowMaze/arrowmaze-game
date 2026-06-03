import { Board } from '../../domain/entities/Board';

/**
 * Input DTO for PlaceArrowUseCase.
 *
 * The Board is passed directly (already in memory) — no IO required.
 * bodyCellIds is optional: omitting it places only the Head segment.
 */
export interface PlaceArrowInput {
  /** The board instance where the arrow will be placed. */
  board: Board;
  /** ID of the cell where the Head segment will be placed. */
  headCellId: string;
  /** Port index representing the arrow's intended direction of travel. */
  exitPort: number;
  /** Ordered list of additional cell IDs for body segments (tail-last). */
  bodyCellIds?: string[];
}

/**
 * Projection of a single ArrowSegment for external consumers.
 * Mirrors the internal linked-list node without exposing domain internals.
 */
export interface ArrowSegmentDTO {
  cellId: string;
  isHead: boolean;
  fromPort: number | null;
  toPort: number | null;
  exitPort: number | null;
}

/**
 * Output DTO for PlaceArrowUseCase.
 * On failure, success = false and error contains the error message.
 */
export interface PlaceArrowResult {
  success: boolean;
  arrowLength: number;
  segments: ArrowSegmentDTO[];
  error?: string;
}
