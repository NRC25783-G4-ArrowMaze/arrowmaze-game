import { Arrow } from '../../domain/entities/Arrow';
import { ArrowSegment } from '../../domain/entities/ArrowSegment';
import type { PlaceArrowInput, PlaceArrowResult, ArrowSegmentDTO } from '../dtos/ArrowDTOs';

/**
 * PlaceArrowUseCase — Application use case for placing an Arrow on the board.
 *
 * Orchestrates:
 * 1. Resolve head cell from the board
 * 2. Instantiate Arrow (which places the Head segment)
 * 3. Extend Arrow with each body cell ID in order
 * 4. Project the resulting linked-list to ArrowSegmentDTOs
 *
 * All domain logic (topology validation, port arithmetic) is delegated to Arrow.
 * This use case contains no business logic itself.
 */
export class PlaceArrowUseCase {
  execute(input: PlaceArrowInput): PlaceArrowResult {
    const { board, headCellId, exitPort, bodyCellIds = [] } = input;

    try {
      // Step 1 — Resolve head cell
      const headCell = board.getCell(headCellId);
      if (!headCell) {
        return {
          success: false,
          arrowLength: 0,
          segments: [],
          error: `ArrowPlacementError: head cell '${headCellId}' not found on board`,
        };
      }

      // Step 2 — Instantiate Arrow (places Head)
      const arrow = new Arrow(headCell, exitPort);

      // Step 3 — Extend with body cells
      for (const cellId of bodyCellIds) {
        const cell = board.getCell(cellId);
        if (!cell) {
          return {
            success: false,
            arrowLength: arrow.length,
            segments: this._projectChain(arrow.head),
            error: `ArrowPlacementError: body cell '${cellId}' not found on board`,
          };
        }
        arrow.extend(cell);
      }

      // Step 4 — Project and return
      return {
        success: true,
        arrowLength: arrow.length,
        segments: this._projectChain(arrow.head),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        arrowLength: 0,
        segments: [],
        error: message,
      };
    }
  }

  /** Traverse the linked list from head and project each node to a DTO. */
  private _projectChain(head: ArrowSegment): ArrowSegmentDTO[] {
    const result: ArrowSegmentDTO[] = [];
    let current: ArrowSegment | null = head;
    while (current !== null) {
      result.push({
        cellId: current.getCellId(),
        isHead: current.isHead,
        fromPort: current.fromPort,
        toPort: current.toPort,
        exitPort: current.exitPort,
      });
      current = current.next;
    }
    return result;
  }
}
