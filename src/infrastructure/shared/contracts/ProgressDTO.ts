// shared/contracts/ProgressDTO.ts

/**
 * Payload enviado por el cliente (Motor del Juego) 
 * cuando el jugador completa un nivel.
 */
export interface SaveProgressPayloadDTO {
  levelId: string;
  score: number;
  movesUsed: number;
  timeElapsedSeconds: number;
}

/**
 * Objeto de progreso consolidado que el servidor devuelve al cliente.
 */
export interface LevelProgressDTO {
  levelId: string;
  userId: string;
  score: number;
  movesUsed: number;
  timeElapsedSeconds: number;
  
  // Propiedad adicional recomendada para saber cuándo se logró este récord
  achievedAt: string; // Formato ISO 8601 (ej. "2026-06-18T20:52:15.000Z")
}