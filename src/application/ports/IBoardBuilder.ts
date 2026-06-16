import type { Board } from '../../domain/entities/Board';
import type { LevelDataDTO } from '../../infrastructure/shared/contracts/LevelDataDTOs'; 

/**
 * IBoardBuilder — Puerto de aplicación para construir un Board desde LevelData.
 *
 * Los casos de uso dependen de esta ABSTRACCIÓN, no de la implementación
 * concreta (BoardFactory, que vive en infraestructura). Infraestructura
 * implementa este puerto. Esto invierte la dependencia (DIP) y respeta la
 * Regla de Dependencia: aplicación no conoce infraestructura.
 */
export interface IBoardBuilder {
  build(data: LevelDataDTO): Board;
}