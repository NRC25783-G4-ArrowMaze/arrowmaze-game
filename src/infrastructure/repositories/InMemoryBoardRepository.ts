import { Board } from '../../domain/entities/Board';
import { IBoardRepository } from '../../application/ports/IBoardRepository';
import { BoardFactory, LevelData } from '../factories/BoardFactory';

/**
 * InMemoryBoardRepository — implementación in-memory de IBoardRepository.
 *
 * Almacena fixtures de LevelData y los convierte a Board bajo demanda via BoardFactory.
 * Diseñado para:
 * - Tests de integración sin red
 * - Desarrollo local (MVP)
 *
 * Para producción, usar HttpBoardRepository (Iteración 3).
 */
export class InMemoryBoardRepository implements IBoardRepository {
  private readonly fixtures: Map<string, LevelData>;

  constructor(fixtures: LevelData[] = []) {
    this.fixtures = new Map(fixtures.map(f => [f.id, f]));
  }

  async getBoardForLevel(levelId: string): Promise<Board> {
    const data = this.fixtures.get(levelId);
    if (!data) {
      throw new Error(`BoardRepositoryError: level '${levelId}' not found`);
    }
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
