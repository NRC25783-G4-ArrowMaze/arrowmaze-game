import type { LeaderboardResponse } from '../dtos/LeaderboardDTOs';

/**
 * LevelNotRegisteredError — El backend respondió 404: el nivel no existe en su
 * registro (LevelRegistryError). DISTINTO del tablero vacío (200 con
 * topPlayers: []): el adapter es fiel al contrato y los separa; la equivalencia
 * visual (mostrar ambos como "aún no hay récords") la decide la UI.
 *
 * Vive junto al puerto porque es parte de su contrato (no del dominio).
 */
export class LevelNotRegisteredError extends Error {
  constructor(levelId: string) {
    super(`El nivel '${levelId}' no está registrado en el backend`);
    this.name = 'LevelNotRegisteredError';
  }
}

/**
 * ILeaderboardApiClient — Puerto del cliente de clasificaciones.
 *
 * Errores del contrato: 401 → SessionExpiredError · 404 →
 * LevelNotRegisteredError · otros fallos → NetworkError.
 */
export interface ILeaderboardApiClient {
  /** Top del nivel + registro del usuario actual (Bearer requerido). */
  getByLevel(levelId: string): Promise<LeaderboardResponse>;
}
