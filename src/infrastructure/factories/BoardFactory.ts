import { Board } from '../../domain/entities/Board';
import { Cell } from '../../domain/entities/Cell';

// ─────────────────────────────────────────────
// DATA SCHEMA (nivel como JSON)
// Schema flexible, fácilmente extensible.
// ─────────────────────────────────────────────

/** Describe una celda del nivel en formato serializable. */
export interface CellData {
  id: string;
  portCount: number;
}

/** Describe un enlace bidireccional entre dos puertos de celdas. */
export interface ConnectionData {
  fromCell: string;
  fromPort: number;
  toCell: string;
  toPort: number;
}

/**
 * Estructura de datos raw de un nivel.
 * Este schema es intencionalmente simple y extensible.
 * Campos futuros (metadata, objetivos, etc.) se añadirán sin romper la factory.
 */
export interface LevelData {
  id: string;
  name: string;
  difficulty: string;
  cells: CellData[];
  connections: ConnectionData[];
}

// ─────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────

/**
 * BoardFactory — Infrastructure service que transforma un LevelData (JSON)
 * en un Board del dominio completamente construido y conectado.
 *
 * Responsabilidades:
 * 1. Crear todas las Cell con su portCount
 * 2. Registrarlas en el Board
 * 3. Aplicar todas las conexiones declaradas en el JSON
 * 4. Propagar errores de dominio sin envolver (TopologyError, ConnectionError)
 *
 * Los errores de dominio ya son descriptivos y no necesitan re-wrapping.
 */
export class BoardFactory {
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

      // Board.connectPorts valida: no self-connect, puerto libre, índice en rango.
      // Los errores de dominio se propagan directamente.
      board.connectPorts(fromCell, conn.fromPort, toCell, conn.toPort);
    }

    return board;
  }
}
