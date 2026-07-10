/**
 * LeaderboardDTOs — Espejo del contrato del backend
 * (GET /api/v1/leaderboards/:levelId → LeaderboardResponseDTO).
 *
 * `username` llega como ALIAS SEGURO desde el backend (el dominio del servidor
 * lo deriva del email); es contenido del usuario y no se traduce. `achievedAt`
 * viaja en el contrato pero la UI v1 no lo pinta.
 */
export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  movesUsed: number;
  timeElapsedSeconds: number;
  achievedAt: string;
}

export interface LeaderboardResponse {
  /** Top del nivel, ya ordenado y rankeado por el backend (default 10). */
  topPlayers: LeaderboardEntry[];
  /** Registro del usuario actual, o null si aún no jugó el nivel. */
  currentRecord: LeaderboardEntry | null;
}
