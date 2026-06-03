import { Board } from '../../domain/entities/Board';
import type { IBoardRepository } from '../../application/ports/IBoardRepository';
import type { ILevelRepository } from '../../application/ports/ILevelRepository';
import { BoardFactory, type LevelData } from '../factories/BoardFactory';

/**
 * InMemoryBoardRepository — implementación in-memory de IBoardRepository e ILevelRepository.
 *
 * Almacena fixtures de LevelData y los sirve de dos formas:
 * - Como ILevelRepository: devuelve el LevelData raw (usado por LoadLevelUseCase)
 * - Como IBoardRepository: construye y devuelve el Board via BoardFactory
 *
 * Diseñado para:
 * - Tests de integración sin red
 * - Desarrollo local (MVP)
 *
 * Para producción, usar HttpLevelRepository / HttpBoardRepository.
 */
export class InMemoryBoardRepository implements IBoardRepository, ILevelRepository {
  private readonly fixtures: Map<string, LevelData>;

  constructor(fixtures: LevelData[] = []) {
    this.fixtures = new Map(fixtures.map(f => [f.id, f]));
  }

  // ─────────────────────────────────────────────
  // ILevelRepository
  // ─────────────────────────────────────────────

  async getLevel(levelId: string): Promise<LevelData> {
    const data = this.fixtures.get(levelId);
    if (!data) {
      throw new Error(`BoardRepositoryError: level '${levelId}' not found`);
    }
    return data;
  }

  // ─────────────────────────────────────────────
  // IBoardRepository
  // ─────────────────────────────────────────────

  async getBoardForLevel(levelId: string): Promise<Board> {
    const data = await this.getLevel(levelId);
    // BoardFactory propaga errores de dominio directamente
    return BoardFactory.fromLevelData(data);
  }

  /**
   * Añade o reemplaza un fixture en tiempo de ejecución.
   * Útil para configurar escenarios de tests individuales.
   */
  addFixture(levelData: LevelData): void {
    this.fixtures.set(levelData.id, levelData);
  }
}
