import { Board } from '../../domain/entities/Board';
import type { LevelData } from '../dtos/LevelData';
import type { IBoardBuilder } from '../ports/IBoardBuilder';

/**
 * BuildBoardUseCase — caso de uso que construye un Board a partir de LevelData.
 *
 * Depende de la abstracción IBoardBuilder (puerto), no de la implementación
 * concreta de infraestructura. La implementación (BoardFactory) se inyecta
 * por constructor, respetando el Principio de Inversión de Dependencias (DIP)
 * y la Regla de Dependencia de Clean Architecture.
 */
export class BuildBoardUseCase {
  private readonly builder: IBoardBuilder;

  constructor(builder: IBoardBuilder) {
    this.builder = builder;
  }

  /**
   * Construye y devuelve un Board a partir de LevelData.
   *
   * @throws `TopologyError` si alguna celda tiene portCount inválido
   * @throws `ConnectionError` si alguna conexión viola invariantes
   * @throws `BoardFactoryError` si se referencia una celda inexistente
   */
  execute(levelData: LevelData): Board {
    return this.builder.build(levelData);
  }
}