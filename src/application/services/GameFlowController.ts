import type { GameSession } from '../../domain/entities/GameSession';
import type { GameFlowState } from '../dtos/GameFlowDTOs';
import { InvalidFlowTransitionError } from '../errors/GameFlowErrors';

/**
 * Autómata de pila (Pushdown Automaton) del flujo de una partida (C1).
 * Envuelve una GameSession de Dominio sin mutarla salvo reemplazo total
 * (restart). Solo el tope de la pila debe recibir input/render — eso lo
 * decide quien consuma `current`, este controller solo lo expone.
 */
export class GameFlowController {
  private _session: GameSession;
  private readonly _stack: GameFlowState[];

  constructor(session: GameSession) {
    this._session = session;
    this._stack = ['ACTIVE'];
  }

  get session(): GameSession { return this._session; }
  get current(): GameFlowState { return this._stack[this._stack.length - 1]; }
  get stack(): readonly GameFlowState[] { return [...this._stack]; }

  pause(): void {
    if (this.current !== 'ACTIVE' || this._session.status !== 'IN_PROGRESS') {
      throw new InvalidFlowTransitionError('pause', this.current);
    }
    this._stack.push('PAUSED');
  }

  resume(): void {
    if (this.current !== 'PAUSED') {
      throw new InvalidFlowTransitionError('resume', this.current);
    }
    this._stack.pop();
  }

  openSettings(): void {
    if (this.current !== 'PAUSED') {
      throw new InvalidFlowTransitionError('openSettings', this.current);
    }
    this._stack.push('SETTINGS');
  }

  closeSettings(): void {
    if (this.current !== 'SETTINGS') {
      throw new InvalidFlowTransitionError('closeSettings', this.current);
    }
    this._stack.pop();
  }

  /** Reemplaza la GameSession actual por una nueva y colapsa la pila a [ACTIVE]. */
  restart(newSession: GameSession): void {
    if (this.current !== 'PAUSED') {
      throw new InvalidFlowTransitionError('restart', this.current);
    }
    this._session = newSession;
    this._stack.length = 0;
    this._stack.push('ACTIVE');
  }
}
