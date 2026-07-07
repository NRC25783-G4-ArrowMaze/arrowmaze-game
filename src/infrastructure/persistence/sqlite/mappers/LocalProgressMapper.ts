import { LevelProgress } from '../../../../domain/entities/LevelProgress';
import { Score } from '../../../../domain/value-objects/Score';
import { type LocalRecord } from '../models/LocalRecord';

export class LocalProgressMapper {
  /**
   * Traduce de la tabla SQLite a la Entidad de Dominio.
   */
  public static toDomain(record: LocalRecord): LevelProgress {
    // Reconstruimos el Value Object
    const scoreVO = Score.createSimpleScore(record.score);
    const achievedAtDate = new Date(record.achievedAt);

    return LevelProgress.create(
      record.levelId,
      scoreVO,
      record.movesUsed,
      record.timeElapsedSeconds,
      achievedAtDate
    );
  }

  /**
   * Traduce de la Entidad de Dominio al formato plano para SQLite.
   */
  public static toPersistence(domain: LevelProgress, isPendingSync: boolean): LocalRecord {
    return {
      levelId: domain.levelId,
      score: domain.score.finalScore,
      movesUsed: domain.movesUsed,
      timeElapsedSeconds: domain.timeElapsedSeconds,
      achievedAt: domain.achievedAt.toISOString(),
      pendingSync: isPendingSync ? 1 : 0
    };
  }
}