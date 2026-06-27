import { type ILocalProgressRepository } from '../../domain/repositories/ILocalProgressRepository';
import { type IProgressApiClient } from '../../domain/repositories/IProgressApiClient';
import { type LevelProgress } from '../../domain/entities/LevelProgress';
import { SessionExpiredError } from '../../domain/errors/SyncErrors';

export class SyncProgress {
  private readonly _localRepository: ILocalProgressRepository;
  private readonly _apiClient: IProgressApiClient;

  constructor(localRepository: ILocalProgressRepository, apiClient: IProgressApiClient) {
    this._localRepository = localRepository;
    this._apiClient = apiClient;
  }

  /**
   * Ejecuta el flujo de sincronización completo (Upstream -> Downstream).
   * Lanzará SessionExpiredError si detecta problemas de autenticación.
   */
  async execute(): Promise<void> {
    try {
      await this.processUpstream();
      await this.processDownstream();
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        // Bloque 3: Interrupción inmediata por expiración del token
        throw error; 
      }
      
      // Si es un NetworkError u otro error imprevisto, detenemos la sincronización
      // silenciosamente, ya que el Offline-First asume que la red es inestable.
      console.warn('[SyncProgress] Sincronización pausada debido a inestabilidad de red.', error);
    }
  }

  /**
   * BLOQUE 1: Upstream (Local -> Servidor)
   */
  private async processUpstream(): Promise<void> {
    const pendingRecords = await this._localRepository.findPendingSync();

    for (const record of pendingRecords) {
      try {
        await this._apiClient.pushProgress(record);
        
        // Si el servidor responde exitosamente (200 OK), marcamos como sincronizado
        await this._localRepository.markAsSynced(record.levelId);
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          throw error; // Propagamos para abortar inmediatamente el proceso
        }
        
        // Retención del estado: Si falla la red, detenemos el Upstream
        // preservando el pendingSync = true para intentar en el futuro.
        console.warn(`[SyncProgress] Fallo al subir nivel ${record.levelId}. Pausando upstream.`);
        break; 
      }
    }
  }

  /**
   * BLOQUE 2: Downstream (Servidor -> Local)
   */
  private async processDownstream(): Promise<void> {
    const remoteRecords = await this._apiClient.fetchUserProgress();

    for (const remoteRecord of remoteRecords) {
      const localRecord = await this._localRepository.findByLevelId(remoteRecord.levelId);

      // Escenario: Descarga de récords remotos que no existen localmente (restauración)
      if (!localRecord) {
        await this.saveAsSynced(remoteRecord);
        continue;
      }

      // Escenario: Comparación de récords
      const isRemoteSuperior = localRecord.isBeatenBy(
        remoteRecord.score,
        remoteRecord.movesUsed,
        remoteRecord.timeElapsedSeconds
      );

      if (isRemoteSuperior) {
        // El remoto es superior, sobrescribimos
        await this.saveAsSynced(remoteRecord);
      }
      
      // Si el local es superior o igual, no hacemos nada (Preservación)
    }
  }

  /**
   * Helper para guardar un registro remoto y garantizar el estado de la bandera en SQLite.
   */
  private async saveAsSynced(progress: LevelProgress): Promise<void> {
    // Al reutilizar el método save() del repositorio, SQLite por defecto 
    // le asignará pendingSync = 1.
    await this._localRepository.save(progress);
    
    // Inmediatamente después, forzamos la bandera a 0 como indica el Gherkin
    // para registros provenientes del servidor.
    await this._localRepository.markAsSynced(progress.levelId);
  }
}