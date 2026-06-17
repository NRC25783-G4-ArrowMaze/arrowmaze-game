import { LevelDataArrowBuilder } from '../../src/application/services/LevelDataArrowBuilder';
import { Board } from '../../src/domain/entities/Board';
import { Cell } from '../../src/domain/entities/Cell';
import { BoardRegistryError } from '../../src/domain/errors/BoardErrors';
import type { LevelArrowDTO } from '../../src/infrastructure/shared/contracts/LevelDataDTOs';

describe('LevelDataArrowBuilder', () => {
  let builder: LevelDataArrowBuilder;
  let board: Board;

  beforeEach(() => {
    builder = new LevelDataArrowBuilder();
    board = new Board('test_board');
    
    const c1 = new Cell('C1', 4);
    const c2 = new Cell('C2', 4);
    
    board.addCell(c1);
    board.addCell(c2);
    // Conectamos C1(1) con C2(3)
    board.connectPorts(c1, 1, c2, 3); 
  });

  it('should_build_arrow_with_head_and_body_when_cells_exist_and_are_connected', () => {
    // Arrange
    const arrowDTOs: LevelArrowDTO[] = [{
      id: 'arr_1',
      head: { cellId: 'C1', exitPort: 2 },
      body: ['C2'] // C2 se conecta lógicamente con C1
    }];

    // Act
    const arrows = builder.buildAll(board, arrowDTOs);

    // Assert
    expect(arrows).toHaveLength(1);
    expect(arrows[0].length).toBe(2); // Head + 1 Body segment
    expect(board.getCell('C1')?.isOccupied()).toBe(true);
    expect(board.getCell('C2')?.isOccupied()).toBe(true);
  });

  it('should_throw_BoardRegistryError_when_head_cell_is_not_in_board', () => {
    // Arrange
    const arrowDTOs: LevelArrowDTO[] = [{
      id: 'arr_bad',
      head: { cellId: 'MISSING', exitPort: 0 },
      body: []
    }];

    // Act & Assert
    expect(() => builder.buildAll(board, arrowDTOs)).toThrow(BoardRegistryError);
  });
});