import { Board } from '../../domain/entities/Board';
import { BoardFactory, LevelData } from '../../infrastructure/factories/BoardFactory';

/**
 * BuildBoardUseCase — caso de uso que construye un Board a partir de datos raw de nivel.
 *
 * Actúa como coordinador entre la capa de aplicación y la factory de infraestructura.
 * Encapsula la lógica de construcción y propaga errores de dominio hacia arriba.
 *
 * Uso típico:
 * - Cuando la capa UI tiene datos de nivel ya descargados y necesita el Board graph.
 * - En flujos offline donde los datos están disponibles localmente.
 */
export class BuildBoardUseCase {
  /**
   * Construye y devuelve un Board a partir de LevelData.
   *
   * @throws `TopologyError` si alguna celda tiene portCount inválido
   * @throws `ConnectionError` si alguna conexión viola invariantes
   * @throws `BoardFactoryError` si se referencia una celda inexistente
   * @throws `BoardRegistryError` si hay IDs de celda duplicados
   */
  execute(levelData: LevelData): Board {
    return BoardFactory.fromLevelData(levelData);
  }
}
