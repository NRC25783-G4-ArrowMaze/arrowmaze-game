import { CapacitorSqliteDriver } from '../persistence/sqlite/CapacitorSqliteDriver';
import { SqliteProgressRepository } from '../persistence/sqlite/sqliteProgressRepository';
import { FetchProgressApiClient } from '../api/FetchProgressApiClient';
import { SaveLocalProgress } from '../../application/use-cases/SaveLocalProgress';
import { GetLocalProgress } from '../../application/use-cases/GetLocalProgress';
import { SyncOfflineProgress } from '../../application/use-cases/SaveOfflineProgress';
import { SyncProgress } from '../../application/use-cases/SyncProgress';
import { type IAuthTokenProvider } from '../../domain/repositories/IAuthTokenProvider';

export interface LocalProgressModule {
  saveLocalProgress: SaveLocalProgress;
  getLocalProgress: GetLocalProgress;
  syncOfflineProgress: SyncOfflineProgress;
  syncProgress: SyncProgress; // 🚀 El nuevo orquestador bidireccional
}

export class LocalProgressModuleFactory {
  /**
   * Ensambla el módulo de progreso local y sincronización, conectando SQLite,
   * el cliente HTTP de la API y los casos de uso del dominio.
   */
  public static async create(
    apiBaseUrl: string,
    tokenProvider: IAuthTokenProvider
  ): Promise<LocalProgressModule> {
    try {
      // 1. Inicialización de Infraestructura de Persistencia
      const driver = new CapacitorSqliteDriver();
      await driver.openDatabase('game_progress_db');

      const repository = new SqliteProgressRepository(driver);
      await repository.initialize();

      // 2. Inicialización de Infraestructura de Red
      const apiClient = new FetchProgressApiClient(apiBaseUrl, tokenProvider);

      // 3. Ensamblaje de la Capa de Aplicación (Casos de Uso)
      const saveLocalProgress = new SaveLocalProgress(repository);
      const getLocalProgress = new GetLocalProgress(repository);
      const syncOfflineProgress = new SyncOfflineProgress(repository);
      const syncProgress = new SyncProgress(repository, apiClient);

      return {
        saveLocalProgress,
        getLocalProgress,
        syncOfflineProgress,
        syncProgress
      };
    } catch (error) {
      console.error('[LocalProgressModuleFactory] Fallo crítico al ensamblar el módulo:', error);
      throw new Error('No se pudo inicializar el almacenamiento y sincronización del juego.');
    }
  }
}