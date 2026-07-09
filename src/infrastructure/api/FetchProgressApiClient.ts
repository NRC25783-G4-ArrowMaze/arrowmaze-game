import { type IProgressApiClient } from '../../application/ports/IProgressApiClient';
import { type IAuthTokenProvider } from '../../application/ports/IAuthTokenProvider';
import { LevelProgress } from '../../domain/entities/LevelProgress';
import { Score } from '../../domain/value-objects/Score';
import { SessionExpiredError, NetworkError } from '../../domain/errors/SyncErrors';

// DTO esperado y devuelto por tu backend (NestJS)
interface ApiProgressDTO {
  levelId: string;
  score: number;
  movesUsed: number;
  timeElapsedSeconds: number;
  achievedAt: string;
}

export class FetchProgressApiClient implements IProgressApiClient {
  private readonly _baseUrl: string;
  private readonly _tokenProvider: IAuthTokenProvider;

  constructor(baseUrl: string, tokenProvider: IAuthTokenProvider) {
    this._baseUrl = baseUrl;
    this._tokenProvider = tokenProvider;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this._tokenProvider.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async pushProgress(progress: LevelProgress): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const payload: ApiProgressDTO = {
        levelId: progress.levelId,
        score: progress.score.finalScore,
        movesUsed: progress.movesUsed,
        timeElapsedSeconds: progress.timeElapsedSeconds,
        achievedAt: progress.achievedAt.toISOString(),
      };

      const response = await fetch(`${this._baseUrl}/api/v1/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        throw new SessionExpiredError();
      }

      if (!response.ok) {
        throw new NetworkError(`Error del servidor al subir progreso: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof SessionExpiredError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : 'Error de red desconocido');
    }
  }

  async fetchUserProgress(): Promise<LevelProgress[]> {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${this._baseUrl}/api/v1/progress`, {
        method: 'GET',
        headers,
      });

      if (response.status === 401) {
        throw new SessionExpiredError();
      }

      if (!response.ok) {
        throw new NetworkError(`Error del servidor al descargar progreso: ${response.status}`);
      }

      const data = (await response.json()) as ApiProgressDTO[];

      return data.map((dto) =>
        LevelProgress.create(
          dto.levelId,
          Score.createSimpleScore(dto.score),
          dto.movesUsed,
          dto.timeElapsedSeconds,
          new Date(dto.achievedAt)
        )
      );
    } catch (error) {
      if (error instanceof SessionExpiredError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : 'Error de red desconocido');
    }
  }
}