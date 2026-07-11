import { type ILeaderboardApiClient } from '../ports/ILeaderboardApiClient';
import type { LeaderboardResponse } from '../dtos/LeaderboardDTOs';

/**
 * GetLevelLeaderboard — Caso de uso de lectura de la clasificación de un nivel.
 *
 * Delgado a propósito: el backend ya ordena, rankea y deriva el alias seguro;
 * aquí no hay reglas de dominio del cliente. Propaga los errores tipados del
 * puerto (SessionExpiredError / LevelNotRegisteredError / NetworkError) para
 * que la UI decida el estado.
 */
export class GetLevelLeaderboard {
  private readonly _apiClient: ILeaderboardApiClient;

  constructor(apiClient: ILeaderboardApiClient) {
    this._apiClient = apiClient;
  }

  async execute(levelId: string): Promise<LeaderboardResponse> {
    return this._apiClient.getByLevel(levelId);
  }
}
