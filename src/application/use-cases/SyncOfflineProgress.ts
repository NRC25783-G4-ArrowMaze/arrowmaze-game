import { type ILocalProgressRepository } from '../ports/ILocalProgressRepository';
import { type LevelProgress } from '../../domain/entities/LevelProgress';

export class SyncOfflineProgress {
  private readonly _repository: ILocalProgressRepository;

  constructor(repository: ILocalProgressRepository) {
    this._repository = repository;
  }

  /**
   * Recupera todos los niveles que se jugaron sin internet o no se han sincronizado.
   */
  async getPendingSyncRecords(): Promise<LevelProgress[]> {
    return this._repository.findPendingSync();
  }

  /**
   * Marca un nivel como sincronizado exitosamente tras recibir un HTTP 200 de la API.
   */
  async markAsSynced(levelId: string): Promise<void> {
    await this._repository.markAsSynced(levelId);
  }
}