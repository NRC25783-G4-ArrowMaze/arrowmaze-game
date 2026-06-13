import type { Board } from './Board';
import { NoMovesRemainingError } from '../errors/GameErrors';

export type GameStatus = 'IN_PROGRESS' | 'WON' | 'LOST';

export class GameSession {
  private _movesRemaining: number;
  private _status: GameStatus;

  constructor(movesRemaining: number) {
    if (movesRemaining < 0) {
      throw new Error('GameSession: movesRemaining must be >= 0');
    }
    this._movesRemaining = movesRemaining;
    this._status = 'IN_PROGRESS';
  }

  get movesRemaining(): number { return this._movesRemaining; }
  get status(): GameStatus { return this._status; }

  consumeMove(): void {
    if (this._movesRemaining === 0) {
      throw new NoMovesRemainingError();
    }
    this._movesRemaining -= 1;
  }

  evaluateStatus(board: Board): GameStatus {
    if (this._status !== 'IN_PROGRESS') {
      return this._status;
    }

    const allEmpty = board.getAllCells().every(cell => !cell.hasArrowSegment());
    if (allEmpty) {
      this._status = 'WON';
      return this._status;
    }

    if (this._movesRemaining === 0) {
      this._status = 'LOST';
      return this._status;
    }

    return this._status;
  }
}
