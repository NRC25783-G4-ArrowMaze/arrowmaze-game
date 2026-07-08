import { AdvanceArrowUseCase } from './AdvanceArrowUseCase';
import { GameAlreadyFinishedError } from '../../domain/errors/GameErrors';
import type { SlideInput, SlideResult } from '../dtos/SlideDTOs';
import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';

/**
 * SlideArrowUseCase — Orquestador de "deslizamiento" (un click = ticks hasta terminal).
 *
 * Encadena AdvanceArrowUseCase tick a tick hasta que el outcome deja de ser
 * 'advanced' (se detiene en 'blocked' o 'destroyed'). Consolida el resultado en
 * la GameSession como UNA sola jugada:
 *   - consume exactamente 1 movimiento (no 1 por tick),
 *   - registra 1 outcome de scoring (no 1 por tick),
 *   - re-evalúa el status una sola vez.
 *
 * NO contiene lógica de dominio: toda regla de avance/colisión/destrucción vive
 * en Arrow.advance(). Aquí solo se encadena y se consolida.
 */
export class SlideArrowUseCase {
  private readonly advanceUseCase: AdvanceArrowUseCase;

  constructor(advanceUseCase: AdvanceArrowUseCase) {
    this.advanceUseCase = advanceUseCase;
  }

  execute(input: SlideInput): SlideResult {
    const { session, board, arrow } = input;

    // ── Paso 1 — Guard terminal ────────────────
    if (session.status !== 'IN_PROGRESS') {
      const err = new GameAlreadyFinishedError(session.status);
      return {
        success: false,
        trajectory: [],
        movesRemaining: session.movesRemaining,
        gameStatus: session.status,
        error: err.message,
      };
    }

    // ── Paso 2 — Encadenar ticks hasta terminal ─
    // Cota defensiva anti-bucle: el dominio garantiza terminación (cada tick libera
    // la cola o se bloquea), pero acotamos al nº de celdas + 1 por seguridad.
    const trajectory: AdvanceOutcome[] = [];
    const maxTicks = board.getAllCells().length + 1;
    let finalOutcome: AdvanceOutcome = 'blocked';

    for (let tick = 0; tick < maxTicks; tick++) {
      const advanceResult = this.advanceUseCase.execute({ board, arrow });

      // Fallo de infra (p.ej. ArrowCinematicError): NO se consume movimiento.
      if (!advanceResult.success) {
        return {
          success: false,
          trajectory,
          movesRemaining: session.movesRemaining,
          gameStatus: 'IN_PROGRESS',
          error: advanceResult.error,
        };
      }

      trajectory.push(advanceResult.outcome);
      finalOutcome = advanceResult.outcome;

      if (advanceResult.outcome !== 'advanced') {
        break; // 'blocked' o 'destroyed' → el slide termina
      }
    }

    // ── Paso 3 — Consumir 1 movimiento (slide = 1 jugada) ─
    session.consumeMove();

    // ── Paso 4 — Registrar 1 outcome de scoring ─
    session.recordMoveOutcome(finalOutcome !== 'blocked');

    // ── Paso 5 — Re-evaluar status una vez ─────
    session.evaluateStatus(board);

    // ── Paso 6 — Retornar ──────────────────────
    return {
      success: true,
      trajectory,
      finalOutcome,
      movesRemaining: session.movesRemaining,
      gameStatus: session.status,
      ...(session.score === null ? {} : { score: session.score.finalScore }),
    };
  }
}
