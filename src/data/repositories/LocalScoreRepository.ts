import { IScoreRepository } from '../../application/ports/IScoreRepository';
import { Score } from '../../domain/value-objects/Score';

export class LocalScoreRepository implements IScoreRepository {
  private scores: Score[] = [];
  private readonly STORAGE_KEY = 'arrow_maze_scores';

  constructor() {
    this.loadScores();
  }

  async saveScore(score: Score): Promise<void> {
    this.scores.push(score);
    this.persistScores();
  }

  async getScores(levelId: string): Promise<Score[]> {
    return this.scores.filter((score) => score.levelId === levelId);
  }

  async getHighScore(levelId: string): Promise<Score | null> {
    const levelScores = await this.getScores(levelId);
    if (levelScores.length === 0) return null;
    return levelScores.reduce((highest, current) =>
      current.points > highest.points ? current : highest
    );
  }

  async getAllScores(): Promise<Score[]> {
    return [...this.scores];
  }

  private persistScores(): void {
    try {
      const serialized = this.scores.map((score) => ({
        levelId: score.levelId,
        points: score.points,
        moves: score.moves,
        time: score.time,
        date: score.date.toISOString(),
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to persist scores:', error);
    }
  }

  private loadScores(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.scores = parsed.map(
          (item: any) =>
            new Score(
              item.levelId,
              item.points,
              item.moves,
              item.time,
              new Date(item.date)
            )
        );
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
      this.scores = [];
    }
  }
}
