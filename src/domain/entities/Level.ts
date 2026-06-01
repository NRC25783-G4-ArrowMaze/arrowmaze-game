export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class Level {
  private readonly id: string;
  private readonly name: string;
  private readonly difficulty: Difficulty;
  private readonly description: string;
  private readonly gridWidth: number;
  private readonly gridHeight: number;
  private readonly timeLimit?: number; // in seconds
  private readonly moveLimit?: number;

  constructor(
    id: string,
    name: string,
    difficulty: Difficulty,
    description: string,
    gridWidth: number,
    gridHeight: number,
    timeLimit?: number,
    moveLimit?: number
  ) {
    this.id = id;
    this.name = name;
    this.difficulty = difficulty;
    this.description = description;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.timeLimit = timeLimit;
    this.moveLimit = moveLimit;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  getDescription(): string {
    return this.description;
  }

  getGridWidth(): number {
    return this.gridWidth;
  }

  getGridHeight(): number {
    return this.gridHeight;
  }

  getTimeLimit(): number | undefined {
    return this.timeLimit;
  }

  getMoveLimit(): number | undefined {
    return this.moveLimit;
  }
}
