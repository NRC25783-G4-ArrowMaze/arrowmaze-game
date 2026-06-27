import { Score } from '../value-objects/Score';

export class LevelProgress {
  private readonly _levelId: string;
  private readonly _score: Score;
  private readonly _movesUsed: number;
  private readonly _timeElapsedSeconds: number;
  private readonly _achievedAt: Date;

  private constructor(
    levelId: string,
    score: Score,
    movesUsed: number,
    timeElapsedSeconds: number,
    achievedAt: Date
  ) {
    this._levelId = levelId;
    this._score = score;
    this._movesUsed = movesUsed;
    this._timeElapsedSeconds = timeElapsedSeconds;
    this._achievedAt = achievedAt;
  }

  get levelId(): string { return this._levelId; }
  get score(): Score { return this._score; }
  get movesUsed(): number { return this._movesUsed; }
  get timeElapsedSeconds(): number { return this._timeElapsedSeconds; }
  get achievedAt(): Date { return this._achievedAt; }

  public static create(
    levelId: string,
    score: Score,
    movesUsed: number,
    timeElapsedSeconds: number,
    achievedAt: Date = new Date()
  ): LevelProgress {
    if (movesUsed < 0) throw new Error('LevelProgress: movesUsed must be >= 0');
    if (timeElapsedSeconds < 0) throw new Error('LevelProgress: timeElapsedSeconds must be >= 0');
    
    return new LevelProgress(levelId, score, movesUsed, timeElapsedSeconds, achievedAt);
  }

  public isBeatenBy(newScore: Score, newMovesUsed: number, newTimeElapsedSeconds: number): boolean {
    const currentScoreValue = this._score.finalScore; 
    const newScoreValue = newScore.finalScore;

    if (newScoreValue !== currentScoreValue) {
      return newScoreValue > currentScoreValue;
    }

    if (newMovesUsed !== this._movesUsed) {
      return newMovesUsed < this._movesUsed;
    }

    if (newTimeElapsedSeconds !== this._timeElapsedSeconds) {
      return newTimeElapsedSeconds < this._timeElapsedSeconds;
    }

    return false;
  }
}