import type { LevelDataDTO } from '../dtos/LevelDataDTOs';

/**
 * Puerto hacia la API de niveles del backend (F2).
 * Endpoint público: no requiere token de sesión.
 */
export interface ILevelApiClient {
  /** Descarga la definición completa de un nivel (`GET /api/v1/levels/:id`). */
  fetchLevel(levelId: string): Promise<LevelDataDTO>;
}
