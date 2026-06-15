import { AdvanceArrowUseCase } from './AdvanceArrowUseCase';
import { GameAlreadyFinishedError } from '../../domain/errors/GameErrors';
import type { PlayMoveInput, PlayMoveResult } from '../dtos/SessionDTOs';

export class PlayMoveUseCase {
  private readonly advanceUseCase: AdvanceArrowUseCase;

  constructor(advanceUseCase: AdvanceArrowUseCase) {
    this.advanceUseCase = advanceUseCase;
  }

  execute(input: PlayMoveInput): PlayMoveResult {
    const { session, board, arrow } = input;

    // Step 1 — Guard terminal
    if (session.status !== 'IN_PROGRESS') {
      const err = new GameAlreadyFinishedError(session.status);
      return {
        success: false,
        error: err.message,
        movesRemaining: session.movesRemaining,
        gameStatus: session.status,
      };
    }

    // Step 2 — Delegate to cinematic use case
    const advanceResult = this.advanceUseCase.execute({ board, arrow });

    // Step 3 — Guard infra failure (no move consumed)
    if (!advanceResult.success) {
      return {
        success: false,
        error: advanceResult.error,
        movesRemaining: session.movesRemaining,
        gameStatus: 'IN_PROGRESS',
      };
    }

    // Step 4 — Consume move
    session.consumeMove();

    // Step 4.5 — Record outcome for scoring
    session.recordMoveOutcome(advanceResult.outcome !== 'blocked');

    // Step 5 — Re-evaluate status
    session.evaluateStatus(board);

    // Step 6 — Return (include score when WON)
    return {
      success: true,
      outcome: advanceResult.outcome,
      movesRemaining: session.movesRemaining,
      gameStatus: session.status,
      ...(session.score !== null ? { score: session.score.finalScore } : {}),
    };
  }
}
