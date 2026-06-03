import { LevelData } from '../../infrastructure/factories/BoardFactory';

/**
 * ILevelRepository — puerto de aplicación para obtener la topología de un nivel.
 *
 * Devuelve LevelData (schema serializable de celdas + conexiones) en lugar de
 * una entidad de dominio Level, ya que en esta feature el único concepto de
 * "nivel" es su estructura de grafo pasivo.
 *
 * Implementaciones:
 * - InMemoryBoardRepository (tests / dev)
 * - HttpLevelRepository      (producción)
 */
export interface ILevelRepository {
  /**
   * Obtiene el LevelData raw de un nivel por su ID.
   * Lanza si el nivel no existe.
   */
  getLevel(levelId: string): Promise<LevelData>;
}
