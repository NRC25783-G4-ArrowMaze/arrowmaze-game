import { InMemoryLevelRepository } from '../../src/infrastructure/repositories/InMemoryLevelRepository';
import { LevelLoader } from '../../src/application/use-cases/LevelLoader';
import type { IBoardBuilder } from '../../src/application/ports/IBoardBuilder';
import type { IArrowBuilder } from '../../src/application/ports/IArrowBuilder';
import type { LevelDataDTO } from '../../src/application/dtos/LevelDataDTOs';
import type { LoadedLevel } from '../../src/domain/repositories/ILevelRepository';

// Mockeamos la clase entera para interceptar el método load
jest.mock('../../src/application/use-cases/LevelLoader');

describe('InMemoryLevelRepository', () => {
  let mockLoader: jest.Mocked<LevelLoader>;
  let repository: InMemoryLevelRepository;

  const fakeDto: LevelDataDTO = { 
    id: 'lvl_abc', allowedMoves: 10, arrows: [], cells: [] 
  };

  beforeEach(() => {
    mockLoader = new LevelLoader(
      null as unknown as IBoardBuilder,
      null as unknown as IArrowBuilder
    ) as jest.Mocked<LevelLoader>;
    repository = new InMemoryLevelRepository(mockLoader);
    repository.addFixture(fakeDto);
  });

  it('should_return_raw_dto_when_getLevel_is_called_with_existing_id', async () => {
    // Act
    const data = await repository.getLevel('lvl_abc');

    // Assert
    expect(data).toEqual(fakeDto);
  });

  it('should_throw_error_when_getLevel_is_called_with_unknown_id', async () => {
    // Act & Assert
    await expect(repository.getLevel('unknown')).rejects.toThrow(/not found/);
  });

  it('should_delegate_to_loader_when_getLoadedLevel_is_called', async () => {
    // Arrange
    const fakeLoadedLevel = { board: {}, arrows: [] } as unknown as LoadedLevel;
    mockLoader.load.mockReturnValue(fakeLoadedLevel);

    // Act
    const result = await repository.getLoadedLevel('lvl_abc');

    // Assert
    expect(mockLoader.load).toHaveBeenCalledWith(fakeDto);
    expect(result).toBe(fakeLoadedLevel);
  });
});