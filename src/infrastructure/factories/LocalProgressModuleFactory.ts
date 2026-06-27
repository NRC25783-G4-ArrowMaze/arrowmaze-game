import { CapacitorSqliteDriver } from '../persistence/sqlite/CapacitorSqliteDriver';
import { SqliteProgressRepository } from '../persistence/sqlite/sqliteProgressRepository';
import { SaveLocalProgress } from '../../application/use-cases/SaveLocalProgress';
import { GetLocalProgress } from '../../application/use-cases/GetLocalProgress';
import { SyncOfflineProgress } from '../../application/use-cases/SaveOfflineProgress';

// Definimos un tipo estricto para el retorno de la fábrica
export interface LocalProgressModule {
  saveLocalProgress: SaveLocalProgress;
  getLocalProgress: GetLocalProgress;
  syncOfflineProgress: SyncOfflineProgress;
}

export class LocalProgressModuleFactory {
  /**
   * Ensambla el módulo de progreso local, inicializando la base de datos nativa
   * y conectando la infraestructura con los casos de uso del dominio.
   */
  public static async create(): Promise<LocalProgressModule> {
    try {
      // 1. Inicialización de la Infraestructura
      const driver = new CapacitorSqliteDriver();
      await driver.openDatabase('game_progress_db');

      const repository = new SqliteProgressRepository(driver);
      await repository.initialize(); // Garantiza que la tabla exista

      // 2. Ensamblaje de la Capa de Aplicación (Casos de Uso)
      const saveLocalProgress = new SaveLocalProgress(repository);
      const getLocalProgress = new GetLocalProgress(repository);
      const syncOfflineProgress = new SyncOfflineProgress(repository);

      // 3. Retornamos el módulo empaquetado y listo para usar
      return {
        saveLocalProgress,
        getLocalProgress,
        syncOfflineProgress
      };
    } catch (error) {
      console.error('[LocalProgressModuleFactory] Fallo crítico al ensamblar el módulo:', error);
      throw new Error('No se pudo inicializar el almacenamiento local del juego.');
    }
  }
}