import type { Board } from './Board';
import { NoMovesRemainingError } from '../errors/GameErrors';
import { ScoringTracker } from '../value-objects/ScoringTracker';
import { Score } from '../value-objects/Score';

export type GameStatus = 'IN_PROGRESS' | 'WON' | 'LOST';

export class GameSession {
  private _movesRemaining: number;
  private _status: GameStatus;
  private readonly _scoringTracker: ScoringTracker;
  private _score: Score | null;

  constructor(movesRemaining: number) {
    if (movesRemaining < 0) {
      throw new Error('GameSession: movesRemaining must be >= 0');
    }
    this._movesRemaining = movesRemaining;
    this._status = 'IN_PROGRESS';
    this._scoringTracker = new ScoringTracker();
    this._score = null;
  }

  get movesRemaining(): number { return this._movesRemaining; }
  get status(): GameStatus { return this._status; }
  get score(): Score | null { return this._score; }

  consumeMove(): void {
    if (this._movesRemaining === 0) {
      throw new NoMovesRemainingError();
    }
    this._movesRemaining -= 1;
  }

  /**
   * Registra el outcome de un movimiento para los contadores de scoring.
   * moveSucceeded=true  (advanced | destroyed): resetea la racha de fallas.
   * moveSucceeded=false (blocked):             incrementa racha y penalización.
   * Siempre incrementa ticksUsed en 1.
   */
  recordMoveOutcome(moveSucceeded: boolean): void {
    this._scoringTracker.recordTick();
    if (moveSucceeded) {
      this._scoringTracker.recordSuccess();
    } else {
      this._scoringTracker.recordFailure();
    }
  }

  evaluateStatus(board: Board): GameStatus {
    if (this._status !== 'IN_PROGRESS') {
      return this._status;
    }

    const allEmpty = board.getAllCells().every(cell => !cell.hasArrowSegment());
    if (allEmpty) {
      this._status = 'WON';
      this._score = Score.compute(this._scoringTracker);
      return this._status;
    }

    if (this._movesRemaining === 0) {
      this._status = 'LOST';
      return this._status;
    }

    return this._status;
  }
}
