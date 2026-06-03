import { Cell } from '../entities/Cell';

/**
 * TopologyQueryService - Passive domain service for querying graph topology.
 *
 * Provides named, intent-revealing query operations on top of the raw Cell API.
 * All methods are read-only — they never mutate state.
 *
 * Rationale: The Cell entity exposes low-level getNeighborAtPort() / isExit().
 * This service adds a semantic layer so Arrow entities (and tests) can query
 * topology through a single, stable interface.
 */
export class TopologyQueryService {
  /**
   * Returns the neighbor Cell connected at the given port, or null if it is an exit.
   */
  getNeighborCell(cell: Cell, portIndex: number): Cell | null {
    return cell.getNeighborAtPort(portIndex);
  }

  /**
   * Returns true if the given port on the Cell has no neighbor (is an exit).
   */
  isExit(cell: Cell, portIndex: number): boolean {
    return cell.isExit(portIndex);
  }

  /**
   * Returns all Cells directly adjacent to the given Cell (non-null neighbors across all ports).
   * The result is deduplicated in case of multi-port connections to the same neighbor.
   */
  getAdjacentCells(cell: Cell): Cell[] {
    const result: Cell[] = [];
    const seen = new Set<Cell>();

    for (let i = 0; i < cell.getPortCount(); i++) {
      const neighbor = cell.getNeighborAtPort(i);
      if (neighbor && !seen.has(neighbor)) {
        seen.add(neighbor);
        result.push(neighbor);
      }
    }

    return result;
  }
}
