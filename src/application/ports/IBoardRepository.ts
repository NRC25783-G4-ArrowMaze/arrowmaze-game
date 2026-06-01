import { Board } from '../../domain/entities/Board';

/**
 * IBoardRepository — puerto de aplicación para obtener el Board graph de un nivel.
 *
 * Separado de ILevelRepository porque:
 * - ILevelRepository maneja metadatos (nombre, dificultad, límites)
 * - IBoardRepository maneja la topología del grafo (celdas + conexiones)
 *
 * Implementaciones:
 * - InMemoryBoardRepository (tests / dev)
 * - HttpBoardRepository      (producción)
 */
export interface IBoardRepository {
  /**
   * Obtiene el Board graph construido para un nivel específico.
   * Lanza si el nivel no existe o la topología es inválida.
   */
  getBoardForLevel(levelId: string): Promise<Board>;
}
