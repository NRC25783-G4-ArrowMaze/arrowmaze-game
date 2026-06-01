import { Level } from '../../domain/entities/Level';

export interface ILevelRepository {
  getLevel(levelId: string): Promise<Level>;
  getAllLevels(): Promise<Level[]>;
  getLevelsByDifficulty(difficulty: string): Promise<Level[]>;
}
