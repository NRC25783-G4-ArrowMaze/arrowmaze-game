import { Cell } from '../entities/Cell';
import { TopologyQueryService } from './TopologyQueryService';

/**
 * PathChecker - Domain service for reachability queries on the board graph.
 *
 * Uses BFS to determine whether any exit port is reachable from a start Cell
 * by traversing the port-based topology of the board.
 *
 * An "exit" is a port on any cell that has no neighbor connected (isExit == true).
 * A cell with at least one exit port is considered a border/exit cell.
 */
export class PathChecker {
  private static readonly queryService = new TopologyQueryService();

  /**
   * Returns true if, starting from startCell, BFS can reach a Cell that has
   * at least one exit port (i.e., the traversal can escape the graph).
   */
  static canReachExit(startCell: Cell): boolean {
    const visited = new Set<string>();
    const queue: Cell[] = [startCell];

    while (queue.length > 0) {
      const cell = queue.shift()!;
      const key = cell.getId();

      if (visited.has(key)) continue;
      visited.add(key);

      // A cell with at least one exit port is a border cell — path can exit here.
      for (let i = 0; i < cell.getPortCount(); i++) {
        if (this.queryService.isExit(cell, i)) {
          return true;
        }
      }

      // Enqueue all connected neighbors.
      const adjacent = this.queryService.getAdjacentCells(cell);
      for (const neighbor of adjacent) {
        if (!visited.has(neighbor.getId())) {
          queue.push(neighbor);
        }
      }
    }

    return false;
  }
}

