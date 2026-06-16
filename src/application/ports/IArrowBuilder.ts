import { Board } from '../../domain/entities/Board';
import { Arrow } from '../../domain/entities/Arrow';
import type { LevelArrowDTO } from '../../infrastructure/shared/contracts/LevelDataDTOs';

export interface IArrowBuilder {
  /**
   * Construye e hidrata todas las flechas basándose en el tablero proporcionado.
   */
  buildAll(board: Board, arrowDTOs: LevelArrowDTO[]): Arrow[];
}