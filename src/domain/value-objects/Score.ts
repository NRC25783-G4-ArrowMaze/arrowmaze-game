import type { ScoringTracker } from './ScoringTracker';
import { SCORING_CONSTANTS } from './ScoringConstants';

export class Score {
  readonly timeScore: number;
  readonly penaltyTotal: number;
  readonly flawlessVictory: boolean;
  readonly finalScore: number;

  private constructor(
    timeScore: number,
    penaltyTotal: number,
    flawlessVictory: boolean,
    finalScore: number,
  ) {
    this.timeScore = timeScore;
    this.penaltyTotal = penaltyTotal;
    this.flawlessVictory = flawlessVictory;
    this.finalScore = finalScore;
    Object.freeze(this);
  }

  /**
   * Fórmula:
   *   timeScore  = max(0, BASE − ticksUsed × DECAY)
   *   finalScore = max(0, timeScore − accumulatedPenalty + (flawlessVictory ? FLAWLESS_BONUS : 0))
   */
  static compute(tracker: ScoringTracker): Score {
    const timeScore = Math.max(
      0,
      SCORING_CONSTANTS.BASE - tracker.ticksUsed * SCORING_CONSTANTS.DECAY,
    );
    const flawlessVictory = tracker.totalFails === 0;
    const finalScore = Math.max(
      0,
      timeScore
        - tracker.accumulatedPenalty
        + (flawlessVictory ? SCORING_CONSTANTS.FLAWLESS_BONUS : 0),
    );
    return new Score(timeScore, tracker.accumulatedPenalty, flawlessVictory, finalScore);
  }

  static createSimpleScore(value: number):Score{
    return new Score(0,0,false,value);
  }
}
