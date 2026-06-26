import type { GameSession, GameStatus } from '../../domain/entities/GameSession';
import type { Board } from '../../domain/entities/Board';
import type { Arrow } from '../../domain/entities/Arrow';
import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';

/**
 * Input DTO para SlideArrowUseCase.
 * Mismas dependencias en memoria que PlayMoveUseCase (application → domain permitido).
 */
export interface SlideInput {
  session: GameSession;
  board: Board;
  arrow: Arrow;
}

/**
 * Output DTO de SlideArrowUseCase.
 *
 * Un "slide" = un click = encadenar advance() hasta que el outcome deja de ser
 * 'advanced' (es decir, 'blocked' o 'destroyed'). Consume exactamente 1 movimiento.
 */
export interface SlideResult {
  success: boolean;
  /** Outcome de cada tick en orden: ['advanced', ..., 'blocked' | 'destroyed']. */
  trajectory: AdvanceOutcome[];
  /** Outcome del último tick (estado en que se detuvo el slide). Ausente si success=false. */
  finalOutcome?: AdvanceOutcome;
  movesRemaining: number;
  gameStatus: GameStatus;
  /** Presente solo cuando gameStatus === 'WON'. */
  score?: number;
  /** Presente solo cuando success === false. */
  error?: string;
}
