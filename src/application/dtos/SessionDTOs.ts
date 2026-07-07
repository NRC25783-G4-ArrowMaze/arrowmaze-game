import type { GameStatus, GameSession } from '../../domain/entities/GameSession';
import type { Board } from '../../domain/entities/Board';
import type { Arrow } from '../../domain/entities/Arrow';

export interface PlayMoveInput {
  session: GameSession;
  board: Board;
  arrow: Arrow;
}

export interface PlayMoveResult {
  success: boolean;
  outcome?: 'advanced' | 'blocked' | 'destroyed';
  movesRemaining: number;
  gameStatus: GameStatus;
  score?: number;   // presente solo cuando gameStatus === 'WON'
  error?: string;
}
