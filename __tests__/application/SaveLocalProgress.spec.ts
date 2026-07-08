import { SaveLocalProgress } from '../../src/application/use-cases/SaveLocalProgress';
import { type ILocalProgressRepository } from '../../src/application/ports/ILocalProgressRepository';
import { LevelProgress } from '../../src/domain/entities/LevelProgress';
import { Score } from '../../src/domain/value-objects/Score';

describe('SaveLocalProgress Use Case', () => {
  let mockRepository: jest.Mocked<ILocalProgressRepository>;
  let useCase: SaveLocalProgress;

  const createScore = (value: number) => Score.createSimpleScore(value);

  beforeEach(() => {
    // Declaración estricta de todos los métodos del contrato para evitar ts(2322) y el uso de 'any'
    mockRepository = {
      initialize: jest.fn(),
      findByLevelId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findPendingSync: jest.fn(),
      markAsSynced: jest.fn(),
    };

    useCase = new SaveLocalProgress(mockRepository);
  });

  it('debe guardar un nuevo registro si el nivel nunca ha sido jugado', async () => {
    // Arrange: Simula que no hay récord previo en SQLite
    mockRepository.findByLevelId.mockResolvedValue(null);
    const score = createScore(1500);

    // Act
    await useCase.execute('level_01', score, 12, 45);

    // Assert
    expect(mockRepository.findByLevelId).toHaveBeenCalledWith('level_01');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    
    // Verificamos que se guardó con los datos correctos
    const savedRecord = mockRepository.save.mock.calls[0][0];
    expect(savedRecord.levelId).toBe('level_01');
    expect(savedRecord.score.finalScore).toBe(1500);
    expect(savedRecord.movesUsed).toBe(12);
    expect(savedRecord.timeElapsedSeconds).toBe(45);
  });

  it('debe sobrescribir el registro si el nuevo intento supera al récord histórico', async () => {
    // Arrange: Simula un récord previo inferior
    const oldScore = createScore(1000);
    const historicalRecord = LevelProgress.create('level_01', oldScore, 15, 60);
    mockRepository.findByLevelId.mockResolvedValue(historicalRecord);
    
    const newScore = createScore(2000);

    // Act
    await useCase.execute('level_01', newScore, 15, 60);

    // Assert
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedRecord = mockRepository.save.mock.calls[0][0];
    expect(savedRecord.score.finalScore).toBe(2000);
  });

  it('no debe modificar la base de datos si el nuevo intento es inferior o igual al récord', async () => {
    // Arrange: Simula un récord previo muy alto
    const oldScore = createScore(2500);
    const historicalRecord = LevelProgress.create('level_01', oldScore, 10, 30);
    mockRepository.findByLevelId.mockResolvedValue(historicalRecord);
    
    const worseScore = createScore(1200);

    // Act
    await useCase.execute('level_01', worseScore, 15, 60);

    // Assert
    // Se consultó la DB, pero NUNCA se llamó al método save
    expect(mockRepository.findByLevelId).toHaveBeenCalledWith('level_01');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});