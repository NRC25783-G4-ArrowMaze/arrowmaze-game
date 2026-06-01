import { Score } from '../../domain/value-objects/Score';

export interface IScoreRepository {
  saveScore(score: Score): Promise<void>;
  getScores(levelId: string): Promise<Score[]>;
  getHighScore(levelId: string): Promise<Score | null>;
  getAllScores(): Promise<Score[]>;
}
