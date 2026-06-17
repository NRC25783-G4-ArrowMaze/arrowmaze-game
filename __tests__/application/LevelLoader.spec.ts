import { LevelLoader } from '../../src/application/use-cases/LevelLoader';
import { type IBoardBuilder } from '../../src/application/ports/IBoardBuilder';
import { type IArrowBuilder } from '../../src/application/ports/IArrowBuilder';
import { Board } from '../../src/domain/entities/Board';
import { Arrow } from '../../src/domain/entities/Arrow';
import type { LevelDataDTO } from '../../src/infrastructure/shared/contracts/LevelDataDTOs';

describe('LevelLoader', () => {
  let mockBoardBuilder: jest.Mocked<IBoardBuilder>;
  let mockArrowBuilder: jest.Mocked<IArrowBuilder>;
  let loader: LevelLoader;

  beforeEach(() => {
    mockBoardBuilder = { build: jest.fn() };
    mockArrowBuilder = { buildAll: jest.fn() };
    loader = new LevelLoader(mockBoardBuilder, mockArrowBuilder);
  });

  it('should_orchestrate_board_and_arrow_builders_and_return_LoadedLevel', () => {
    // Arrange
    const fakeData: LevelDataDTO = { id: 'lvl_1', allowedMoves: 5, arrows: [], cells: [] };
    const fakeBoard = new Board('lvl_1');
    const fakeArrows: any[] = [];

    mockBoardBuilder.build.mockReturnValue(fakeBoard);
    mockArrowBuilder.buildAll.mockReturnValue(fakeArrows);

    // Act
    const result = loader.load(fakeData);

    // Assert
    expect(mockBoardBuilder.build).toHaveBeenCalledWith(fakeData);
    expect(mockArrowBuilder.buildAll).toHaveBeenCalledWith(fakeBoard, fakeData.arrows);
    expect(result.board).toBe(fakeBoard);
    expect(result.arrows).toBe(fakeArrows);
  });
});