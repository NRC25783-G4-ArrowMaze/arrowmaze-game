import type { ILoadedLevelRepository, LoadedLevel } from '../../domain/repositories/ILevelRepository';
import type { LevelDataDTO } from '../shared/contracts/LevelDataDTOs';
import { type LevelLoader } from '../../application/use-cases/LevelLoader';

// ─────────────────────────────────────────────
// INTERFACES (Puedes moverlas a la capa de Domain/Application ports)
// ─────────────────────────────────────────────

export interface ILevelRepository {
  getLevel(levelId: string): Promise<LevelDataDTO>;
}


// ─────────────────────────────────────────────
// IMPLEMENTACIÓN EN MEMORIA
// ─────────────────────────────────────────────

export class InMemoryLevelRepository implements ILevelRepository, ILoadedLevelRepository {
  private readonly fixtures: Map<string, LevelDataDTO>;
  private readonly levelLoader: LevelLoader
  constructor(levelLoader: LevelLoader,
    fixtures: LevelDataDTO[] = []
  ) {
    this.levelLoader = levelLoader;
    this.fixtures = new Map(fixtures.map(f => [f.id, f]));
  }

  // ─────────────────────────────────────────────
  // ILevelRepository (Retorna Raw Data)
  // ─────────────────────────────────────────────

  async getLevel(levelId: string): Promise<LevelDataDTO> {
    const data = this.fixtures.get(levelId);
    if (!data) {
      throw new Error(`LevelRepositoryError: level '${levelId}' not found`);
    }
    return data;
  }

  // ─────────────────────────────────────────────
  // ILoadedLevelRepository (Retorna Entidades de Dominio)
  // ─────────────────────────────────────────────

  async getLoadedLevel(levelId: string): Promise<LoadedLevel> {
    const data = await this.getLevel(levelId);
    
    // El repositorio delega la validación y el ensamblaje a la capa de Aplicación
    return this.levelLoader.load(data);
  }

  /**
   * Añade o reemplaza un fixture en tiempo de ejecución.
   * Útil para configurar escenarios de tests individuales.
   */
  addFixture(levelData: LevelDataDTO): void {
    this.fixtures.set(levelData.id, levelData);
  }
}