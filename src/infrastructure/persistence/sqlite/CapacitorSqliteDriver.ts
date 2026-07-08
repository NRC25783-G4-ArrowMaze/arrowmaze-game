import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { type IDatabaseDriver } from './sqliteProgressRepository';

export class CapacitorSqliteDriver implements IDatabaseDriver {
  private readonly _sqlite: SQLiteConnection;
  private _db: SQLiteDBConnection | null = null;

  /** En web la BD vive en memoria (jeep-sqlite): hay que volcarla al store tras cada mutación. */
  private readonly _isWeb = Capacitor.getPlatform() === 'web';
  private _dbName = '';

  constructor() {
    // Inicializamos el puente nativo de Capacitor
    this._sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Abre la conexión nativa a la base de datos en el dispositivo.
   */
  async openDatabase(dbName: string = 'game_progress_db'): Promise<void> {
    try {
      this._dbName = dbName;
      // Verifica si la conexión ya existe para evitar errores en recargas en caliente (HMR de Vite)
      const isConnection = await this._sqlite.isConnection(dbName, false);
      
      if (isConnection.result) {
        this._db = await this._sqlite.retrieveConnection(dbName, false);
      } else {
        this._db = await this._sqlite.createConnection(dbName, false, 'no-encryption', 1, false);
      }

      await this._db.open();
    } catch (error) {
      console.error('[CapacitorSqliteDriver] Error abriendo la base de datos:', error);
      throw error;
    }
  }

  /**
   * Cumple el contrato genérico de nuestra infraestructura.
   */
  async executeSql<T>(query: string, params: (string | number)[] = []): Promise<T[]> {
    if (!this._db) {
      throw new Error('Database not initialized. Call openDatabase first.');
    }

    try {
      // Capacitor distingue entre consultas de lectura (query) y mutaciones (run)
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        const result = await this._db.query(query, params);
        // Retornamos el array de valores que exige nuestro contrato
        return (result.values as T[]) || [];
      } else {
        await this._db.run(query, params);
        if (this._isWeb) {
          // Vuelca la BD en memoria al IndexedDB de jeep-sqlite (en nativo no aplica).
          await this._sqlite.saveToStore(this._dbName);
        }
        return [];
      }
    } catch (error) {
      console.error('[CapacitorSqliteDriver] Error ejecutando SQL:', query, error);
      throw error;
    }
  }
}