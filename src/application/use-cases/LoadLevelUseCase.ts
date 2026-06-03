import type { IBoardRepository } from '../ports/IBoardRepository';
import type { LoadLevelResult, CellDTO, ConnectionDTO } from '../dtos/GameDTOs';
import { Board } from '../../domain/entities/Board';

/**
 * LoadLevelUseCase — carga la topología de un nivel y la expone como DTOs.
 *
 * Depende del puerto IBoardRepository (abstracción), que devuelve un Board
 * de dominio ya construido. NO conoce infraestructura ni la BoardFactory:
 * obtener el Board y construirlo es responsabilidad del repositorio inyectado.
 * Esto respeta la Regla de Dependencia de Clean Architecture.
 */
export class LoadLevelUseCase {
  private readonly boardRepository: IBoardRepository;

  constructor(boardRepository: IBoardRepository) {
    this.boardRepository = boardRepository;
  }

  async execute(levelId: string): Promise<LoadLevelResult> {
    try {
      const board = await this.boardRepository.getBoardForLevel(levelId);

      return {
        success: true,
        levelId: board.getId(),
        cells: this.extractCells(board),
        connections: this.extractConnections(board),
      };
    } catch (error) {
      return {
        success: false,
        levelId,
        cells: [],
        connections: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────

  private extractCells(board: Board): CellDTO[] {
    return board.getAllCells().map(cell => ({
      id: cell.getId(),
      portCount: cell.getPortCount(),
      isOccupied: cell.isOccupied(),
    }));
  }

  private extractConnections(board: Board): ConnectionDTO[] {
    const connections: ConnectionDTO[] = [];
    const seen = new Set<string>();

    for (const cell of board.getAllCells()) {
      for (let portIndex = 0; portIndex < cell.getPortCount(); portIndex++) {
        const neighbor = cell.getNeighborAtPort(portIndex);
        if (!neighbor) continue;

        const neighborPortIndex = cell._getNeighborPortIndex(portIndex)!;

        const sides = [
          `${cell.getId()}:${portIndex}`,
          `${neighbor.getId()}:${neighborPortIndex}`,
        ].sort();
        const key = `${sides[0]}↔${sides[1]}`;

        if (!seen.has(key)) {
          seen.add(key);
          connections.push({
            fromCellId: cell.getId(),
            fromPort: portIndex,
            toCellId: neighbor.getId(),
            toPort: neighborPortIndex,
          });
        }
      }
    }

    return connections;
  }
}