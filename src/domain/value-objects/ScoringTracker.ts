import { SCORING_CONSTANTS } from './ScoringConstants';

export class ScoringTracker {
  private _ticksUsed: number = 0;
  private _totalFails: number = 0;
  private _consecutiveFails: number = 0;
  private _accumulatedPenalty: number = 0;

  

  get ticksUsed(): number { return this._ticksUsed; }
  get totalFails(): number { return this._totalFails; }
  get consecutiveFails(): number { return this._consecutiveFails; }
  get accumulatedPenalty(): number { return this._accumulatedPenalty; }

  recordTick(): void {
    this._ticksUsed += 1;
  }

  recordSuccess(): void {
    this._consecutiveFails = 0;
  }

  recordFailure(): void {
    this._consecutiveFails += 1;
    this._totalFails += 1;
    this._accumulatedPenalty +=
      SCORING_CONSTANTS.BASE_PENALTY * this._consecutiveFails;
  }
}
