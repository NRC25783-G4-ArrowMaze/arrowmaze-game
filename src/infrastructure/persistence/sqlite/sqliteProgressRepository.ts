import { type ILocalProgressRepository } from '../../../domain/repositories/ILocalProgressRepository';
import { type LevelProgress } from '../../../domain/entities/LevelProgress';
import { type LocalRecord } from './models/LocalRecord';
import { LocalProgressMapper } from './mappers/LocalProgressMapper';

// Interfaz adaptadora para tu librería específica de SQLite (Expo, React Native, etc.)
export interface IDatabaseDriver {
  executeSql<T>(query: string, params?: (string | number)[]): Promise<T[]>;
}

export class SqliteProgressRepository implements ILocalProgressRepository {
  private readonly _db: IDatabaseDriver;

  constructor(db: IDatabaseDriver) {
    this._db = db;
  }

  async initialize(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS level_progress (
        levelId TEXT PRIMARY KEY,
        score INTEGER NOT NULL,
        movesUsed INTEGER NOT NULL,
        timeElapsedSeconds INTEGER NOT NULL,
        achievedAt TEXT NOT NULL,
        pendingSync INTEGER NOT NULL
      );
    `;
    await this._db.executeSql(query);
  }

  async findByLevelId(levelId: string): Promise<LevelProgress | null> {
    const query = `SELECT * FROM level_progress WHERE levelId = ? LIMIT 1;`;
    const results = await this._db.executeSql<LocalRecord>(query, [levelId]);

    if (results.length === 0) {
      return null;
    }

    return LocalProgressMapper.toDomain(results[0]);
  }

  async findAll(): Promise<LevelProgress[]> {
    const query = `SELECT * FROM level_progress;`;
    const results = await this._db.executeSql<LocalRecord>(query);

    return results.map((record: LocalRecord) => LocalProgressMapper.toDomain(record));
  }

  async save(progress: LevelProgress): Promise<void> {
    // Al guardar un nuevo récord local, siempre lo marcamos como pendiente de sincronización
    const record = LocalProgressMapper.toPersistence(progress, true);

    const query = `
      INSERT OR REPLACE INTO level_progress 
      (levelId, score, movesUsed, timeElapsedSeconds, achievedAt, pendingSync) 
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    const params: (string | number)[] = [
      record.levelId,
      record.score,
      record.movesUsed,
      record.timeElapsedSeconds,
      record.achievedAt,
      record.pendingSync
    ];

    await this._db.executeSql(query, params);
  }

  async findPendingSync(): Promise<LevelProgress[]> {
    const query = `SELECT * FROM level_progress WHERE pendingSync = 1;`;
    const results = await this._db.executeSql<LocalRecord>(query);

    return results.map((record: LocalRecord) => LocalProgressMapper.toDomain(record));
  }

  async markAsSynced(levelId: string): Promise<void> {
    const query = `UPDATE level_progress SET pendingSync = 0 WHERE levelId = ?;`;
    await this._db.executeSql(query, [levelId]);
  }
}