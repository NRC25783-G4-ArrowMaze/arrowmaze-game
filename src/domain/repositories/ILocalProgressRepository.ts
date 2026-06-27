import { type LevelProgress } from '../entities/LevelProgress';

export interface ILocalProgressRepository {
  /**
   * Inicializa la base de datos creando las tablas necesarias si no existen.
   */
  initialize(): Promise<void>;

  /**
   * Obtiene el progreso histórico de un nivel específico. 
   * Retorna null si el nivel no ha sido completado previamente.
   */
  findByLevelId(levelId: string): Promise<LevelProgress | null>;

  /**
   * Recupera todos los progresos registrados en la base de datos local.
   * Útil para la pantalla de selección de niveles y cálculo de estrellas.
   */
  findAll(): Promise<LevelProgress[]>;

  /**
   * Guarda o sobrescribe el progreso de un nivel.
   * La implementación de infraestructura se encargará de marcar internamente
   * la bandera de sincronización (pendingSync = true) en SQLite.
   */
  save(progress: LevelProgress): Promise<void>;

  /**
   * Recupera todos los progresos locales que aún no han sido enviados a la API REST.
   * La infraestructura filtrará los registros donde pendingSync sea verdadero,
   * y los mapeará a la entidad de dominio LevelProgress antes de devolverlos.
   */
  findPendingSync(): Promise<LevelProgress[]>;

  /**
   * Actualiza el estado de un registro indicando que ya fue recibido por el servidor.
   * La infraestructura pasará la bandera pendingSync a falso en SQLite.
   */
  markAsSynced(levelId: string): Promise<void>;
}