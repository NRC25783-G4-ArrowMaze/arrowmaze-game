import { Level, Difficulty } from '../../domain/entities/Level';
import { ILevelRepository } from '../../application/ports/ILevelRepository';

/**
 * InMemoryLevelRepository — implementación in-memory de ILevelRepository.
 *
 * Almacena instancias de Level estáticas.
 * Diseñado para tests y desarrollo local sin dependencia de API externa.
 *
 * Los metadatos de nivel (nombre, dificultad, límites) viven aquí.
 * La topología del grafo vive en InMemoryBoardRepository.
 */
export class InMemoryLevelRepository implements ILevelRepository {
  private readonly levels: Map<string, Level>;

  constructor(levels: Level[] = []) {
    this.levels = new Map(levels.map(l => [l.getId(), l]));
  }

  async getLevel(levelId: string): Promise<Level> {
    const level = this.levels.get(levelId);
    if (!level) {
      throw new Error(`LevelRepositoryError: level '${levelId}' not found`);
    }
    return level;
  }

  async getAllLevels(): Promise<Level[]> {
    return Array.from(this.levels.values());
  }

  async getLevelsByDifficulty(difficulty: string): Promise<Level[]> {
    return Array.from(this.levels.values()).filter(
      l => l.getDifficulty() === (difficulty as Difficulty)
    );
  }

  /**
   * Añade o reemplaza un Level en tiempo de ejecución.
   * Útil para configurar escenarios de tests individuales.
   */
  addLevel(level: Level): void {
    this.levels.set(level.getId(), level);
  }
}
