import { BuildBoardUseCase } from '../../src/application/use-cases/BuildBoardUseCase';
import { LevelData, BoardFactory } from '../../src/infrastructure/factories/BoardFactory';

const VALID_DATA: LevelData = {
  id: 'test-board',
  name: 'Test',
  difficulty: 'EASY',
  allowedMoves: 10,
  cells: [
    { id: 'a', portCount: 4 },
    { id: 'b', portCount: 4 },
  ],
  connections: [
    { fromCell: 'a', fromPort: 0, toCell: 'b', toPort: 2 },
  ],
};

describe('BuildBoardUseCase', () => {
  describe('execute — valid topology', () => {
    it('should return a Board with the correct ID', () => {
      const useCase = new BuildBoardUseCase(new BoardFactory());
      const board = useCase.execute(VALID_DATA);
      expect(board.getId()).toBe('test-board');
    });

    it('should return a Board with all declared cells', () => {
      const useCase = new BuildBoardUseCase(new BoardFactory());
      const board = useCase.execute(VALID_DATA);
      expect(board.getAllCells().length).toBe(2);
    });

    it('should have connections applied in the returned Board', () => {
      const useCase = new BuildBoardUseCase(new BoardFactory());
      const board = useCase.execute(VALID_DATA);

      const a = board.getCell('a')!;
      const b = board.getCell('b')!;

      expect(a.getNeighborAtPort(0)).toBe(b);
      expect(b.getNeighborAtPort(2)).toBe(a);
    });

    it('should work for a board with no connections', () => {
      const data: LevelData = {
        id: 'empty-connections',
        name: 'Empty',
        difficulty: 'EASY',
        allowedMoves: 5,
        cells: [{ id: 'solo', portCount: 4 }],
        connections: [],
      };
      const useCase = new BuildBoardUseCase(new BoardFactory());
      const board = useCase.execute(data);
      expect(board.getAllCells().length).toBe(1);
    });
  });

  describe('execute — invalid topology (propagates domain errors)', () => {
    it('should propagate TopologyError for odd port count', () => {
      const data: LevelData = {
        id: 'bad',
        name: 'Bad',
        difficulty: 'EASY',
        allowedMoves: 5,
        cells: [{ id: 'x', portCount: 3 }],
        connections: [],
      };
      const useCase = new BuildBoardUseCase(new BoardFactory());
      expect(() => useCase.execute(data)).toThrow(
        'TopologyError: port count must be an even number'
      );
    });

    it('should propagate ConnectionError for self-connection', () => {
      const data: LevelData = {
        id: 'self',
        name: 'Self',
        difficulty: 'EASY',
        allowedMoves: 5,
        cells: [{ id: 'loop', portCount: 4 }],
        connections: [{ fromCell: 'loop', fromPort: 0, toCell: 'loop', toPort: 2 }],
      };
      const useCase = new BuildBoardUseCase(new BoardFactory());
      expect(() => useCase.execute(data)).toThrow(
        'ConnectionError: a cell cannot connect to itself'
      );
    });

    it('should propagate BoardFactoryError for unknown cell reference', () => {
      const data: LevelData = {
        id: 'ghost',
        name: 'Ghost',
        difficulty: 'EASY',
        allowedMoves: 5,
        cells: [{ id: 'real', portCount: 4 }],
        connections: [{ fromCell: 'ghost', fromPort: 0, toCell: 'real', toPort: 0 }],
      };
      const useCase = new BuildBoardUseCase(new BoardFactory());
      expect(() => useCase.execute(data)).toThrow('BoardFactoryError');
    });
  });
});