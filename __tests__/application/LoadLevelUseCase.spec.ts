import { LoadLevelUseCase } from '../../src/application/use-cases/LoadLevelUseCase';
import { InMemoryBoardRepository } from '../../src/infrastructure/repositories/InMemoryBoardRepository';
import { LevelData } from '../../src/infrastructure/factories/BoardFactory';

// ─────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────

const LEVEL_TOPOLOGY: LevelData = {
  id: 'level-1',
  name: 'Tutorial',
  difficulty: 'EASY',
  allowedMoves: 10,
  cells: [
    { id: 'c1', portCount: 4 },
    { id: 'c2', portCount: 4 },
    { id: 'c3', portCount: 4 },
  ],
  connections: [
    { fromCell: 'c1', fromPort: 1, toCell: 'c2', toPort: 3 },
    { fromCell: 'c2', fromPort: 1, toCell: 'c3', toPort: 3 },
  ],
};

function makeUseCase() {
  const repo = new InMemoryBoardRepository([LEVEL_TOPOLOGY]);
  return new LoadLevelUseCase(repo);
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

describe('LoadLevelUseCase', () => {
  describe('execute — success', () => {
    it('should return success: true for existing level', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('level-1');
      expect(result.success).toBe(true);
    });

    it('should return the correct levelId', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('level-1');
      expect(result.levelId).toBe('level-1');
    });

    it('should return all cells as CellDTOs', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('level-1');

      expect(result.cells.length).toBe(3);
      expect(result.cells.map(c => c.id)).toEqual(
        expect.arrayContaining(['c1', 'c2', 'c3'])
      );
    });

    it('should return correct portCount for each cell', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('level-1');
      for (const cell of result.cells) {
        expect(cell.portCount).toBe(4);
      }
    });

    it('should return isOccupied: false for all cells initially', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('level-1');
      for (const cell of result.cells) {
        expect(cell.isOccupied).toBe(false);
      }
    });

    it('should return deduplicated connections', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('level-1');

      // 2 connections declared in LEVEL_TOPOLOGY → 2 ConnectionDTOs (not 4)
      expect(result.connections.length).toBe(2);
    });

    it('should include correct fromCellId and toCellId in connections', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('level-1');

      const cellIds = result.connections.flatMap(c => [c.fromCellId, c.toCellId]);
      expect(cellIds).toContain('c1');
      expect(cellIds).toContain('c2');
      expect(cellIds).toContain('c3');
    });
  });

  describe('execute — not found', () => {
    it('should return success: false when level does not exist', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('nonexistent');
      expect(result.success).toBe(false);
    });

    it('should include an error message when level not found', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('nonexistent');
      expect(result.error).toContain('nonexistent');
    });

    it('should return empty cells and connections arrays on failure', async () => {
      const useCase = makeUseCase();
      const result = await useCase.execute('nonexistent');
      expect(result.cells).toEqual([]);
      expect(result.connections).toEqual([]);
    });

    it('should return success: false when repo has no topology for level', async () => {
      const repo = new InMemoryBoardRepository([]); // no topology loaded
      const useCase = new LoadLevelUseCase(repo);

      const result = await useCase.execute('level-1');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

