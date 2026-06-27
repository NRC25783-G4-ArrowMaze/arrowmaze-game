import { type LevelProgress } from '../entities/LevelProgress';

export interface IProgressApiClient {
  /**
   * Envía un registro de progreso al servidor.
   * @throws {SessionExpiredError} Si el servidor rechaza el token.
   * @throws {NetworkError} Si hay fallo de conexión (timeout o 5xx).
   */
  pushProgress(progress: LevelProgress): Promise<void>;

  /**
   * Recupera todos los récords de este usuario almacenados en el servidor.
   * @throws {SessionExpiredError} Si el servidor rechaza el token.
   * @throws {NetworkError} Si hay fallo de conexión.
   */
  fetchUserProgress(): Promise<LevelProgress[]>;
}