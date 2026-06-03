import { Board } from '../../domain/entities/Board';
import type { CellDTO } from '../dtos/GameDTOs';
import { TopologyQueryService } from '../../domain/services/TopologyQueryService';
import { PathChecker } from '../../domain/services/PathChecker';

/**
 * QueryTopologyUseCase — caso de uso pasivo para consultas sobre el grafo del board.
 *
 * Expone operaciones de lectura de topología a la capa UI/Store
 * sin exponer las entidades de dominio directamente.
 *
 * INVARIANTE: ningún método de esta clase muta el estado del Board.
 */
export class QueryTopologyUseCase {
  private readonly queryService = new TopologyQueryService();

  /**
   * Devuelve todas las celdas directamente adyacentes (conectadas) a la celda dada.
   *
   * @throws si la celda no existe en el board
   */
  getAdjacentCells(board: Board, cellId: string): CellDTO[] {
    const cell = this.resolveCell(board, cellId);
    return this.queryService.getAdjacentCells(cell).map(c => ({
      id: c.getId(),
      portCount: c.getPortCount(),
      isOccupied: c.isOccupied(),
    }));
  }

  /**
   * Devuelve true si el puerto indicado en la celda es una salida (sin vecino).
   *
   * @throws si la celda no existe en el board
   */
  isExitPort(board: Board, cellId: string, portIndex: number): boolean {
    const cell = this.resolveCell(board, cellId);
    return this.queryService.isExit(cell, portIndex);
  }

  /**
   * Devuelve true si existe al menos un puerto de salida alcanzable desde la celda
   * recorriendo el grafo por BFS (delega en PathChecker).
   *
   * @throws si la celda no existe en el board
   */
  canReachExit(board: Board, cellId: string): boolean {
    const cell = this.resolveCell(board, cellId);
    return PathChecker.canReachExit(cell);
  }

  // ─────────────────────────────────────────────
  // HELPER PRIVADO
  // ─────────────────────────────────────────────

  private resolveCell(board: Board, cellId: string) {
    const cell = board.getCell(cellId);
    if (!cell) {
      throw new Error(`QueryTopologyError: cell '${cellId}' not found in board`);
    }
    return cell;
  }
}
