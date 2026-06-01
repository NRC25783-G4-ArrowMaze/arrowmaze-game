import { Position } from '../value-objects/Position';

export abstract class DomainEvent {
  readonly timestamp: Date;
  readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.timestamp = new Date();
  }
}

export class PlayerMoved extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly from: Position,
    readonly to: Position,
    readonly moveNumber: number
  ) {
    super(aggregateId);
  }
}

export class LevelCompleted extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly levelId: string,
    readonly moves: number,
    readonly elapsedTime: number
  ) {
    super(aggregateId);
  }
}

export class GameOver extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly levelId: string,
    readonly reason: 'TIME_LIMIT' | 'MOVE_LIMIT' | 'QUIT'
  ) {
    super(aggregateId);
  }
}
