import { SCORING_CONSTANTS } from './ScoringConstants';

export class ScoringTracker {
  private _ticksUsed: number;
  private _totalFails: number;
  private _consecutiveFails: number;
  private _accumulatedPenalty: number;

  constructor() {
    this._ticksUsed = 0;
    this._totalFails = 0;
    this._consecutiveFails = 0;
    this._accumulatedPenalty = 0;
  }

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
