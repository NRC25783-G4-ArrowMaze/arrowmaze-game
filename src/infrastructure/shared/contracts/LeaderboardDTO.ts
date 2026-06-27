export interface LeaderboardEntryDTO {
  rank: number;
  username: string;
  score: number;
  movesUsed: number;
  timeElapsedSeconds: number;
  achievedAt: string;
}

export interface LeaderboardResponseDTO {
  topPlayers: LeaderboardEntryDTO[];
  currentRecord: LeaderboardEntryDTO | null;
}