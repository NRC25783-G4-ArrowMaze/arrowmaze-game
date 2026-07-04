import { type ILocalProgressRepository } from '../ports/ILocalProgressRepository';
import { type LevelProgress } from '../../domain/entities/LevelProgress';

export class GetLocalProgress {
  private readonly _repository: ILocalProgressRepository;

  constructor(repository: ILocalProgressRepository) {
    this._repository = repository;
  }

  /**
   * Obtiene todos los progresos para renderizar el menú principal o mapa de niveles.
   */
  async getAll(): Promise<LevelProgress[]> {
    return this._repository.findAll();
  }

  /**
   * Obtiene el progreso de un nivel puntual (ej. antes de entrar a jugar para mostrar el High Score).
   */
  async getByLevel(levelId: string): Promise<LevelProgress | null> {
    return this._repository.findByLevelId(levelId);
  }
}