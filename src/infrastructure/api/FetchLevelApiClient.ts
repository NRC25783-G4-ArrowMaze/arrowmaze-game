import { type ILevelApiClient } from '../../application/ports/ILevelApiClient';
import type { LevelDataDTO } from '../../application/dtos/LevelDataDTOs';
import { NetworkError } from '../../domain/errors/SyncErrors';

/**
 * Cliente HTTP de la API de niveles (F2). El endpoint es público (sin token) y
 * el fetch se aborta por timeout para que un backend caído no retrase el
 * arranque más allá de `timeoutMs` (el caller cae a la escena local).
 */
export class FetchLevelApiClient implements ILevelApiClient {
  private readonly _baseUrl: string;
  private readonly _timeoutMs: number;

  constructor(baseUrl: string, timeoutMs: number = 3000) {
    this._baseUrl = baseUrl;
    this._timeoutMs = timeoutMs;
  }

  async fetchLevel(levelId: string): Promise<LevelDataDTO> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeoutMs);

    try {
      const response = await fetch(`${this._baseUrl}/api/v1/levels/${levelId}`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new NetworkError(`Error del servidor al descargar el nivel: ${response.status}`);
      }

      return (await response.json()) as LevelDataDTO;
    } catch (error) {
      if (error instanceof NetworkError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : 'Error de red desconocido');
    } finally {
      clearTimeout(timer);
    }
  }
}
