export interface LocalRecord {
  levelId: string;
  score: number;
  movesUsed: number;
  timeElapsedSeconds: number;
  achievedAt: string; // Se almacena como cadena ISO 8601
  pendingSync: number; // 0 para false, 1 para true
}