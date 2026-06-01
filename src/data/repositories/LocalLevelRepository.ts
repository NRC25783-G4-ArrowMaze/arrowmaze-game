import { ILevelRepository } from '../../application/ports/ILevelRepository';
import { Level, Difficulty } from '../../domain/entities/Level';

export class LocalLevelRepository implements ILevelRepository {
  private levels: Map<string, Level> = new Map();

  constructor() {
    this.initializeLevels();
  }

  async getLevel(levelId: string): Promise<Level> {
    const level = this.levels.get(levelId);
    if (!level) {
      throw new Error(`Level ${levelId} not found`);
    }
    return level;
  }

  async getAllLevels(): Promise<Level[]> {
    return Array.from(this.levels.values());
  }

  async getLevelsByDifficulty(difficulty: string): Promise<Level[]> {
    return Array.from(this.levels.values()).filter(
      (level) => level.getDifficulty() === difficulty
    );
  }

  private initializeLevels(): void {
    // Initialize with sample levels
    const level1 = new Level(
      'level-1',
      'First Steps',
      Difficulty.EASY,
      'Learn the basics of Arrow Maze',
      5,
      5,
      60,
      20
    );

    const level2 = new Level(
      'level-2',
      'Challenge Time',
      Difficulty.MEDIUM,
      'A moderate challenge awaits',
      7,
      7,
      90,
      30
    );

    const level3 = new Level(
      'level-3',
      'Master',
      Difficulty.HARD,
      'Only for the brave',
      10,
      10,
      120,
      50
    );

    this.levels.set(level1.getId(), level1);
    this.levels.set(level2.getId(), level2);
    this.levels.set(level3.getId(), level3);
  }
}
