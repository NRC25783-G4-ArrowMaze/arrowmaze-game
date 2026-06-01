import { ILevelRepository } from '../ports/ILevelRepository';
import { IBoardRepository } from '../ports/IBoardRepository';
import { LoadLevelResult, CellDTO, ConnectionDTO } from '../dtos/GameDTOs';
import { Board } from '../../domain/entities/Board';

/**
 * LoadLevelUseCase — carga los metadatos y la topología del board de un nivel.
 *
 * Orquesta dos repositorios:
 * - ILevelRepository  → metadatos del nivel (nombre, dificultad, límites)
 * - IBoardRepository  → grafo topológico (celdas + conexiones)
 *
 * Devuelve un LoadLevelResult con DTOs port-based, sin exponer entidades de dominio.
 */
export class LoadLevelUseCase {
  constructor(
    private readonly levelRepository: ILevelRepository,
    private readonly boardRepository: IBoardRepository,
  ) {}

  async execute(levelId: string): Promise<LoadLevelResult> {
    try {
      // Carga en paralelo: metadatos + topología
      const [level, board] = await Promise.all([
        this.levelRepository.getLevel(levelId),
        this.boardRepository.getBoardForLevel(levelId),
      ]);

      return {
        success: true,
        levelId: level.getId(),
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

        // Clave canónica para deduplicar (cada conexión aparece desde ambos lados)
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

