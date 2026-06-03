import type { LevelData } from '../dtos/LevelData';

/**
 * ILevelRepository — puerto de aplicación para obtener la topología de un nivel.
 *
 * Devuelve LevelData (schema serializable de celdas + conexiones). El contrato
 * LevelData vive en la capa de aplicación, no en infraestructura.
 */
export interface ILevelRepository {
  getLevel(levelId: string): Promise<LevelData>;
}