import { Board } from '../../domain/entities/Board';

/**
 * IBoardRepository — puerto de aplicación para obtener el Board graph ya construido.
 *
 * Complementa ILevelRepository:
 * - ILevelRepository devuelve LevelData raw (schema serializable)
 * - IBoardRepository devuelve un Board de dominio ya construido y validado
 *
 * Implementaciones:
 * - InMemoryBoardRepository (tests / dev): implementa ambos contratos sobre fixtures
 * - HttpBoardRepository      (producción): construye el Board desde una API remota
 */
export interface IBoardRepository {
  /**
   * Obtiene el Board graph construido para un nivel específico.
   * Lanza si el nivel no existe o la topología es inválida.
   */
  getBoardForLevel(levelId: string): Promise<Board>;
}
