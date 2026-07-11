import {
  type ILeaderboardApiClient,
  LevelNotRegisteredError,
} from '../../application/ports/ILeaderboardApiClient';
import { type IAuthTokenProvider } from '../../application/ports/IAuthTokenProvider';
import type { LeaderboardResponse } from '../../application/dtos/LeaderboardDTOs';
import { SessionExpiredError, NetworkError } from '../../domain/errors/SyncErrors';

/**
 * FetchLeaderboardApiClient — Adapter HTTP del leaderboard
 * (GET /api/v1/leaderboards/:levelId, protegido con Bearer).
 *
 * Contrato verificado contra el backend real (LeaderboardRoutes +
 * LeaderboardController): 200 → DTO (vacío = topPlayers:[] con 200, NO 404) ·
 * 401 → SessionExpiredError · 404 (LevelRegistryError: nivel no registrado) →
 * LevelNotRegisteredError · otro fallo → NetworkError. El token jamás se
 * loguea ni se expone fuera del header.
 */
export class FetchLeaderboardApiClient implements ILeaderboardApiClient {
  private readonly _baseUrl: string;
  private readonly _tokenProvider: IAuthTokenProvider;

  constructor(baseUrl: string, tokenProvider: IAuthTokenProvider) {
    this._baseUrl = baseUrl;
    this._tokenProvider = tokenProvider;
  }

  async getByLevel(levelId: string): Promise<LeaderboardResponse> {
    const token = await this._tokenProvider.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this._baseUrl}/api/v1/leaderboards/${levelId}`, {
        method: 'GET',
        headers,
      });
    } catch {
      throw new NetworkError('No se pudo contactar el servidor de leaderboards');
    }

    if (response.status === 401) {
      throw new SessionExpiredError();
    }
    if (response.status === 404) {
      throw new LevelNotRegisteredError(levelId);
    }
    if (!response.ok) {
      throw new NetworkError(`Error del servidor al pedir el leaderboard: ${response.status}`);
    }

    return (await response.json()) as LeaderboardResponse;
  }
}
