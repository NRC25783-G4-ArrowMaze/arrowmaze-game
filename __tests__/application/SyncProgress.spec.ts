import { SyncProgress } from '../../src/application/use-cases/SyncProgress';
import { type ILocalProgressRepository } from '../../src/application/ports/ILocalProgressRepository';
import { type IProgressApiClient } from '../../src/application/ports/IProgressApiClient';
import { LevelProgress } from '../../src/domain/entities/LevelProgress';
import { Score } from '../../src/domain/value-objects/Score';
import { SessionExpiredError } from '../../src/domain/errors/SyncErrors';

describe('SyncProgress Use Case (Orquestador Bidireccional)', () => {
  let mockLocalRepo: jest.Mocked<ILocalProgressRepository>;
  let mockApiClient: jest.Mocked<IProgressApiClient>;
  let useCase: SyncProgress;

  // Helper estricto para crear métricas en los tests
  const createScore = (value: number) => Score.createSimpleScore(value);
  const fixedDate = new Date('2026-06-27T10:00:00Z');

  beforeEach(() => {
    // Declaración explícita de contratos para evadir ts(2322) y el uso de 'any'
    mockLocalRepo = {
      initialize: jest.fn(),
      findByLevelId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findPendingSync: jest.fn(),
      markAsSynced: jest.fn(),
    };

    mockApiClient = {
      pushProgress: jest.fn(),
      fetchUserProgress: jest.fn(), // 🚀 Corregido: coincide con IProgressApiClient
    };

    useCase = new SyncProgress(mockLocalRepo, mockApiClient);
  });

  // ══════════════════════════════════════════════
  // BLOQUE 1: UPSTREAM (Local -> Servidor)
  // ══════════════════════════════════════════════

  it('debe ejecutar el Upstream exitosamente y marcar los registros como sincronizados (Bloque 1 - Escenario 1)', async () => {
    // Arrange
    const pendingRecord = LevelProgress.create('level_01', createScore(1500), 12, 45, fixedDate);
    mockLocalRepo.findPendingSync.mockResolvedValue([pendingRecord]);
    mockApiClient.pushProgress.mockResolvedValue(); // Simula HTTP 200
    mockApiClient.fetchUserProgress.mockResolvedValue([]); // Sin descargas para este test

    // Act
    await useCase.execute();

    // Assert
    expect(mockApiClient.pushProgress).toHaveBeenCalledWith(pendingRecord);
    expect(mockLocalRepo.markAsSynced).toHaveBeenCalledWith('level_01');
  });

  it('debe pausar la sincronización silenciosamente si ocurre un error de red genérico (Bloque 1 - Escenario 2)', async () => {
    // Arrange
    const pendingRecord = LevelProgress.create('level_01', createScore(1500), 12, 45, fixedDate);
    mockLocalRepo.findPendingSync.mockResolvedValue([pendingRecord]);
    
    // Simula fallo de red
    mockApiClient.pushProgress.mockRejectedValue(new Error('Network Timeout'));

    // Act & Assert
    // Se asegura de que el orquestador atrape el error de red y no explote (Offline-first)
    await expect(useCase.execute()).resolves.toBeUndefined();
    expect(mockLocalRepo.markAsSynced).not.toHaveBeenCalled(); // Retiene pendingSync = true
  });

  // ══════════════════════════════════════════════
  // BLOQUE 3: MANEJO DE SESIÓN
  // ══════════════════════════════════════════════

  it('debe abortar y propagar SessionExpiredError si el token es inválido (Bloque 3)', async () => {
    // Arrange
    const pendingRecord = LevelProgress.create('level_01', createScore(1500), 12, 45, fixedDate);
    mockLocalRepo.findPendingSync.mockResolvedValue([pendingRecord]);
    
    // Simula HTTP 401
    mockApiClient.pushProgress.mockRejectedValue(new SessionExpiredError());

    // Act & Assert
    // El caso de uso DEBE lanzar el error para que la UI cierre la sesión
    await expect(useCase.execute()).rejects.toThrow(SessionExpiredError);

    expect(mockLocalRepo.markAsSynced).not.toHaveBeenCalled();
    expect(mockApiClient.fetchUserProgress).not.toHaveBeenCalled(); // Se interrumpe antes del Downstream
  });

  // ══════════════════════════════════════════════
  // BLOQUE 2: DOWNSTREAM (Servidor -> Local)
  // ══════════════════════════════════════════════

  it('debe descargar récords remotos nuevos y guardarlos localmente marcándolos como sincronizados (Bloque 2 - Restauración)', async () => {
    // Arrange
    mockLocalRepo.findPendingSync.mockResolvedValue([]); // Nada que subir
    
    const remoteRecord = LevelProgress.create('level_02', createScore(2500), 10, 30, fixedDate);
    mockApiClient.fetchUserProgress.mockResolvedValue([remoteRecord]);
    
    // Simula que no existe localmente
    mockLocalRepo.findByLevelId.mockResolvedValue(null);

    // Act
    await useCase.execute();

    // Assert
    expect(mockLocalRepo.save).toHaveBeenCalledWith(remoteRecord);
    expect(mockLocalRepo.markAsSynced).toHaveBeenCalledWith('level_02');
  });

  it('debe sobrescribir el récord local si el remoto es superior (Bloque 2 - Actualización)', async () => {
    // Arrange
    mockLocalRepo.findPendingSync.mockResolvedValue([]);
    
    // Récord local inferior (1000 pts)
    const localRecord = LevelProgress.create('level_01', createScore(1000), 15, 60, fixedDate);
    mockLocalRepo.findByLevelId.mockResolvedValue(localRecord);
    
    // Récord remoto superior (2000 pts)
    const remoteRecord = LevelProgress.create('level_01', createScore(2000), 10, 30, fixedDate);
    mockApiClient.fetchUserProgress.mockResolvedValue([remoteRecord]);

    // Act
    await useCase.execute();

    // Assert
    // Comprobamos que delegó la validación a la entidad y guardó el remoto
    expect(mockLocalRepo.save).toHaveBeenCalledWith(remoteRecord);
    expect(mockLocalRepo.markAsSynced).toHaveBeenCalledWith('level_01');
  });

  it('NO debe sobrescribir el récord local si el local es superior (Bloque 2 - Preservación)', async () => {
    // Arrange
    mockLocalRepo.findPendingSync.mockResolvedValue([]);
    
    // Récord local SUPERIOR (2500 pts)
    const localRecord = LevelProgress.create('level_01', createScore(2500), 10, 30, fixedDate);
    mockLocalRepo.findByLevelId.mockResolvedValue(localRecord);
    
    // Récord remoto INFERIOR (1000 pts)
    const remoteRecord = LevelProgress.create('level_01', createScore(1000), 15, 60, fixedDate);
    mockApiClient.fetchUserProgress.mockResolvedValue([remoteRecord]);

    // Act
    await useCase.execute();

    // Assert
    // Como el local gana, NO debemos guardar la versión que vino del servidor
    expect(mockLocalRepo.save).not.toHaveBeenCalled();
    expect(mockLocalRepo.markAsSynced).not.toHaveBeenCalled();
  });
});