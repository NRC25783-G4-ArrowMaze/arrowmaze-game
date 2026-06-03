import type { ILevelRepository } from '../ports/ILevelRepository';
import type { LoadLevelResult, CellDTO, ConnectionDTO } from '../dtos/GameDTOs';
import { Board } from '../../domain/entities/Board';
import { BoardFactory } from '../../infrastructure/factories/BoardFactory';

/**
 * LoadLevelUseCase — carga la topología de un nivel y la expone como DTOs port-based.
 *
 * Orquesta un único repositorio:
 * - ILevelRepository → LevelData serializable (id, cells[], connections[])
 *
 * Construye el Board graph via BoardFactory y serializa el resultado
 * a DTOs sin exponer entidades de dominio hacia las capas externas.
 *
 * La carga es async para soportar implementaciones de repositorio remotas
 * (HTTP) sin cambios en la firma del caso de uso.
 */
export class LoadLevelUseCase {
  private readonly levelRepository: ILevelRepository;

  constructor(
    levelRepository: ILevelRepository,
  ) {
    this.levelRepository = levelRepository;
  }

  async execute(levelId: string): Promise<LoadLevelResult> {
    try {
      const levelData = await this.levelRepository.getLevel(levelId);
      const board = BoardFactory.fromLevelData(levelData);

      return {
        success: true,
        levelId: levelData.id,
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
