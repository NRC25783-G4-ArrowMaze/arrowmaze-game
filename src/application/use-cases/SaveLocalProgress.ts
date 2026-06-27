import { type ILocalProgressRepository } from '../../domain/repositories/ILocalProgressRepository';
import { LevelProgress } from '../../domain/entities/LevelProgress';
import { type Score } from '../../domain/value-objects/Score';

export class SaveLocalProgress {
  private readonly _repository: ILocalProgressRepository;

  constructor(repository: ILocalProgressRepository) {
    this._repository = repository;
  }

  /**
   * Ejecuta el intento de guardado local.
   * Debe ser llamado al finalizar una partida con estado 'WON'.
   */
  async execute(
    levelId: string,
    finalScore: Score,
    movesUsed: number,
    timeElapsedSeconds: number
  ): Promise<void> {
    // 1. Obtener el historial previo (si existe)
    const historicalRecord = await this._repository.findByLevelId(levelId);

    // 2. Escenario 1: Es la primera vez que se completa el nivel
    if (!historicalRecord) {
      const newRecord = LevelProgress.create(levelId, finalScore, movesUsed, timeElapsedSeconds);
      await this._repository.save(newRecord);
      return;
    }

    // 3. Escenarios 2, 3 y 4: Comparar contra el High Score histórico usando Cascade Sorting
    const isNewRecord = historicalRecord.isBeatenBy(finalScore, movesUsed, timeElapsedSeconds);

    if (isNewRecord) {
      // Se crea una nueva instancia de la entidad con la fecha actualizada
      const updatedRecord = LevelProgress.create(levelId, finalScore, movesUsed, timeElapsedSeconds);
      await this._repository.save(updatedRecord);
    }
    
    // Si isNewRecord es false (Escenario 4), la ejecución termina sin tocar la base de datos local.
  }
}