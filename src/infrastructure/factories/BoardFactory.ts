import { Board } from '../../domain/entities/Board';
import { Cell } from '../../domain/entities/Cell';
import type { IBoardBuilder } from '../../application/ports/IBoardBuilder';
import type { LevelData } from '../../application/dtos/LevelData';

// Re-export del contrato para compatibilidad con imports existentes.
// La definición canónica vive en la capa de aplicación.
export type { LevelData, CellData, ConnectionData } from '../../application/dtos/LevelData';

/**
 * BoardFactory — Servicio de infraestructura que transforma un LevelData (JSON)
 * en un Board del dominio completamente construido y conectado.
 *
 * Implementa el puerto IBoardBuilder definido en la capa de aplicación,
 * de modo que los casos de uso dependan de la abstracción y no de esta clase.
 *
 * Responsabilidades:
 * 1. Crear todas las Cell con su portCount
 * 2. Registrarlas en el Board
 * 3. Aplicar todas las conexiones declaradas en el JSON
 * 4. Propagar errores de dominio sin envolver (TopologyError, ConnectionError)
 */
export class BoardFactory implements IBoardBuilder {
  /**
   * Método de instancia que satisface el puerto IBoardBuilder.
   * Delega en la construcción estática.
   */
  build(data: LevelData): Board {
    return BoardFactory.fromLevelData(data);
  }

  /**
   * Construye un Board a partir de datos de nivel.
   *
   * @throws `TopologyError` si alguna celda tiene portCount impar
   * @throws `ConnectionError` si alguna conexión viola invariantes (auto-connect, puerto ocupado)
   * @throws `BoardFactoryError` si se referencia una celda inexistente en connections
   */
  static fromLevelData(data: LevelData): Board {
    const board = new Board(data.id);
    const cellMap = new Map<string, Cell>();

    // Paso 1: Crear y registrar todas las celdas
    for (const cellData of data.cells) {
      const cell = new Cell(cellData.id, cellData.portCount);
      board.addCell(cell);
      cellMap.set(cellData.id, cell);
    }

    // Paso 2: Aplicar conexiones declaradas
    for (const conn of data.connections) {
      const fromCell = cellMap.get(conn.fromCell);
      const toCell = cellMap.get(conn.toCell);

      if (!fromCell) {
        throw new Error(
          `BoardFactoryError: cell '${conn.fromCell}' referenced in connections not found in cells`
        );
      }
      if (!toCell) {
        throw new Error(
          `BoardFactoryError: cell '${conn.toCell}' referenced in connections not found in cells`
        );
      }

      board.connectPorts(fromCell, conn.fromPort, toCell, conn.toPort);
    }

    return board;
  }
}