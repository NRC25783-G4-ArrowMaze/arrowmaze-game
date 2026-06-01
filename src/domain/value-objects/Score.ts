export class Score {
  constructor(
    readonly levelId: string,
    readonly points: number,
    readonly moves: number,
    readonly time: number, // in seconds
    readonly date: Date
  ) {
    if (points < 0 || moves < 0 || time < 0) {
      throw new Error('Score values must be non-negative');
    }
  }

  isHighScore(other: Score): boolean {
    return this.points > other.points;
  }

  toString(): string {
    return `Score: ${this.points} points, ${this.moves} moves, ${this.time}s`;
  }
}
