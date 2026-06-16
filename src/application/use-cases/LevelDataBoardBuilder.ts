import { type IBoardBuilder } from '../services/IBoardBuilder';
import type { LevelArrowDTO, LevelDataDTO, LevelConnectionDTO } from '../../infrastructure/shared/contracts/LevelDataDTOs';
import { Board } from '../../domain/entities/Board';
import { Cell } from '../../domain/entities/Cell';
import { LevelDataError, ConnectionError, BoardRegistryError } from '../../domain/errors/BoardErrors';

export class LevelDataBoardBuilder implements IBoardBuilder {
  
  public build(data: LevelDataDTO): Board {
    this.validateBaseStructure(data);

    const board = new Board(data.id);

    // 1. Instanciar y registrar celdas en el orden determinista provisto
    for (const cellData of data.cells) {
      this.validateCellData(cellData);
      const cell = new Cell(cellData.id, cellData.portCount);
      board.addCell(cell);
    }

    // 2. Reconstruir topología de conexiones lógicas
    if (data.connections && Array.isArray(data.connections)) {
      for (const conn of data.connections) {
        this.processConnection(board, conn);
      }
    }

    // 3. Verificar integridad del mapeo de flechas iniciales
    for (const arrow of data.arrows) {
      this.validateArrowIntegrity(board, arrow);
    }

    return board;
  }

  private validateBaseStructure(data: LevelDataDTO): void {
    if (!data.id) throw new LevelDataError("missing required field 'id'");
    if (!data.cells) throw new LevelDataError("missing required field 'cells'");
    if (data.allowedMoves === undefined) throw new LevelDataError("missing required field 'allowedMoves'");
    
    if (!Number.isInteger(data.allowedMoves) || data.allowedMoves <= 0) {
      throw new LevelDataError("allowedMoves must be a positive integer");
    }
    if (!Array.isArray(data.cells) || data.cells.length === 0) {
      throw new LevelDataError("board must contain at least one cell");
    }
    if (!Array.isArray(data.arrows)) {
      throw new LevelDataError("missing required field 'arrows'");
    }
  }

  private validateCellData(cellData: any): void {
    if (typeof cellData.portCount !== 'number') {
      throw new LevelDataError("portCount must be a number");
    }
  }

  private processConnection(board: Board, conn: LevelConnectionDTO): void {
    const fromCell = board.getCell(conn.fromCell);
    const toCell = board.getCell(conn.toCell);

    if (!fromCell) throw new BoardRegistryError(`referenced cell "${conn.fromCell}" not found in registry`);
    if (!toCell) throw new BoardRegistryError(`referenced cell "${conn.toCell}" not found in registry`);
    if (fromCell.getId() === toCell.getId()) throw new ConnectionError("a cell cannot connect to itself");

    this.validateOppositePorts(fromCell, conn.fromPort, toCell, conn.toPort);
    board.connectPorts(fromCell, conn.fromPort, toCell, conn.toPort);
  }

  private validateOppositePorts(fromCell: Cell, fromPort: number, toCell: Cell, toPort: number): void {
    const fromPortCount = fromCell.getPortCount();
    const toPortCount = toCell.getPortCount();
    
    // Validamos que ambas celdas tengan la misma geometría (ej. ambas de 4 puertos)
    if (fromPortCount !== toPortCount) {
       throw new ConnectionError("cells with different geometries cannot connect directly via standard rules");
    }

    const expectedOpposite = (fromPort + (fromPortCount / 2)) % fromPortCount;

    if (toPort !== expectedOpposite) {
      throw new ConnectionError(`ports must be opposite (expected ${expectedOpposite}, got ${toPort})`);
    }
  }

  private validateArrowIntegrity(board: Board, arrow: LevelArrowDTO): void {
    if (!arrow.id) throw new LevelDataError("arrow missing 'id'");
    if (!arrow.head?.cellId) throw new LevelDataError(`arrow ${arrow.id} missing head declaration`);
    if (typeof arrow.head.exitPort !== 'number') throw new LevelDataError(`arrow ${arrow.id} head 'exitPort' must be a number`);
    if (!Array.isArray(arrow.body)) throw new LevelDataError(`arrow ${arrow.id} missing 'body' array`);

    if (!board.getCell(arrow.head.cellId)) {
      throw new BoardRegistryError(`arrow ${arrow.id} head references non-existent cell "${arrow.head.cellId}"`);
    }

    for (const bodyCellId of arrow.body) {
      if (!board.getCell(bodyCellId)) {
        throw new BoardRegistryError(`arrow ${arrow.id} body references non-existent cell "${bodyCellId}"`);
      }
    }
  }
}