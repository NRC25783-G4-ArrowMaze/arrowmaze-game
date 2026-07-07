import { Arrow } from '../../domain/entities/Arrow';
import { ArrowSegment } from '../../domain/entities/ArrowSegment';
import { Head } from '../../domain/entities/Head';
import { Segment } from '../../domain/entities/Segment';
import type { PlaceArrowInput, PlaceArrowResult, ArrowSegmentDTO } from '../dtos/ArrowDTOs';
import { ArrowPlacementError } from '../../domain/errors/ArrowErrors';

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

    // Declaramos arrow fuera del try para poder limpiarlo en el catch.
    // Se queda null si ni siquiera llegamos a crear la flecha.
    let arrow: Arrow | null = null;

    try {
      // Step 1 — Resolver celda del head
      const headCell = board.getCell(headCellId);
      if (!headCell) {
        throw new ArrowPlacementError(`head cell '${headCellId}' not found on board`);
      }

      // Step 2 — Instanciar Arrow (coloca el Head)
      arrow = new Arrow(headCell, exitPort);

      // Step 3 — Extender con celdas del cuerpo
      for (const cellId of bodyCellIds) {
        const cell = board.getCell(cellId);
        if (!cell) {
          throw new ArrowPlacementError(`body cell '${cellId}' not found on board`);
        }
        arrow.extend(cell);
      }

      // Step 4 — Proyectar y retornar éxito
      return {
        success: true,
        arrowLength: arrow.length,
        segments: this._projectChain(arrow.head),
      };
    } catch (err: unknown) {
      // ROLLBACK: si alcanzamos a crear la flecha, liberamos cada celda que ocupó.
      if (arrow !== null) {
        arrow.destroy();
      }
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
