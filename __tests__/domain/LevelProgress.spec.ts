import { LevelProgress } from '../../src/domain/entities/LevelProgress';
import { Score } from "../../src/domain/value-objects/Score";
import { InvalidLevelProgressError } from '../../src/domain/errors/ProgressErrors';

describe('LevelProgress Entity - Cascade Sorting', () => {
  // Helpers para crear instancias válidas del Value Object sin usar 'any'
  const createScore = (value: number) => {
    // Asumiendo que Score tiene un constructor o método estático para pruebas
    // Ajusta esto según la implementación real de tu Value Object
    return Score.createSimpleScore(value); 
  };

  it('debe retornar true si el nuevo score es mayor', () => {
    const record = LevelProgress.create('lvl_1', createScore(1000), 15, 60);
    const newScore = createScore(2000);

    const isBeaten = record.isBeatenBy(newScore, 15, 60);

    expect(isBeaten).toBe(true);
  });

  it('debe retornar true si el score es igual pero usa menos movimientos', () => {
    const record = LevelProgress.create('lvl_1', createScore(2000), 15, 60);
    const newScore = createScore(2000);

    const isBeaten = record.isBeatenBy(newScore, 12, 60);

    expect(isBeaten).toBe(true);
  });

  it('debe retornar true si score y movimientos son iguales pero el tiempo es menor', () => {
    const record = LevelProgress.create('lvl_1', createScore(2000), 12, 60);
    const newScore = createScore(2000);

    const isBeaten = record.isBeatenBy(newScore, 12, 45);

    expect(isBeaten).toBe(true);
  });

  it('debe retornar false si el rendimiento es inferior', () => {
    const record = LevelProgress.create('lvl_1', createScore(2500), 10, 30);
    const worseScore = createScore(1200);

    const isBeaten = record.isBeatenBy(worseScore, 15, 60);

    expect(isBeaten).toBe(false);
  });

  it('debe retornar false si hay un empate total en las estadísticas', () => {
    const record = LevelProgress.create('lvl_1', createScore(2500), 10, 30);
    const sameScore = createScore(2500);

    const isBeaten = record.isBeatenBy(sameScore, 10, 30);

    expect(isBeaten).toBe(false);
  });

  it('debe lanzar InvalidLevelProgressError si movesUsed es negativo', () => {
    expect(() => LevelProgress.create('lvl_1', createScore(1000), -1, 60))
      .toThrow(InvalidLevelProgressError);
  });

  it('debe lanzar InvalidLevelProgressError si timeElapsedSeconds es negativo', () => {
    expect(() => LevelProgress.create('lvl_1', createScore(1000), 10, -5))
      .toThrow(InvalidLevelProgressError);
  });
});