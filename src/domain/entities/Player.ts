import { Position } from '../value-objects/Position';

export class Player {
  private position: Position;
  private moves: number = 0;
  private startTime: Date;

  constructor(position: Position) {
    this.position = position;
    this.startTime = new Date();
  }

  getPosition(): Position {
    return this.position;
  }

  setPosition(position: Position): void {
    this.position = position;
    this.moves++;
  }

  getMoves(): number {
    return this.moves;
  }

  getElapsedTime(): number {
    return Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
  }

  resetMoves(): void {
    this.moves = 0;
  }

  resetTimer(): void {
    this.startTime = new Date();
  }
}
