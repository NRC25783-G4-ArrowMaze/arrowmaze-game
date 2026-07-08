import type { GameFlowState } from '../dtos/GameFlowDTOs';

/**
 * Se lanza cuando se intenta una transición de flujo (pause/resume/openSettings/
 * closeSettings/restart) inválida para el tope de pila actual, o cuando se
 * intenta pausar una GameSession que ya no está IN_PROGRESS.
 */
export class InvalidFlowTransitionError extends Error {
  constructor(action: string, currentTop: GameFlowState) {
    super(`InvalidFlowTransitionError: cannot ${action} from state ${currentTop}`);
    this.name = 'InvalidFlowTransitionError';
  }
}
