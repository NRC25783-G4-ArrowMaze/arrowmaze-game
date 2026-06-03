import { BoardFactory, LevelData } from '../../src/infrastructure/factories/BoardFactory';

// ─────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────

const SIMPLE_CHAIN: LevelData = {
  id: 'level-simple',
  name: 'Simple Chain',
  difficulty: 'EASY',
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

const HEX_LEVEL: LevelData = {
  id: 'level-hex',
  name: 'Hexagonal',
  difficulty: 'MEDIUM',
  cells: [
    { id: 'h1', portCount: 6 },
    { id: 'h2', portCount: 6 },
  ],
  connections: [
    { fromCell: 'h1', fromPort: 2, toCell: 'h2', toPort: 5 },
  ],
};

describe('BoardFactory', () => {
  // ──────────────────────────────────────────
  // CONSTRUCCIÓN EXITOSA
  // ──────────────────────────────────────────

  describe('fromLevelData — valid data', () => {
    it('should build a board with the correct ID', () => {
      const board = BoardFactory.fromLevelData(SIMPLE_CHAIN);
      expect(board.getId()).toBe('level-simple');
    });

    it('should register all declared cells', () => {
      const board = BoardFactory.fromLevelData(SIMPLE_CHAIN);
      expect(board.getAllCells().length).toBe(3);
    });

    it('should create cells with correct port counts', () => {
      const board = BoardFactory.fromLevelData(SIMPLE_CHAIN);
      const c1 = board.getCell('c1')!;
      expect(c1.getPortCount()).toBe(4);
    });

    it('should apply bidirectional connections from JSON', () => {
      const board = BoardFactory.fromLevelData(SIMPLE_CHAIN);
      const c1 = board.getCell('c1')!;
      const c2 = board.getCell('c2')!;

      // Forward: c1.port[1] → c2
      expect(c1.getNeighborAtPort(1)).toBe(c2);
      // Reverse: c2.port[3] → c1
      expect(c2.getNeighborAtPort(3)).toBe(c1);
    });

    it('should leave unconnected ports as exits', () => {
      const board = BoardFactory.fromLevelData(SIMPLE_CHAIN);
      const c1 = board.getCell('c1')!;

      expect(c1.isExit(0)).toBe(true);
      expect(c1.isExit(1)).toBe(false); // connected
      expect(c1.isExit(2)).toBe(true);
      expect(c1.isExit(3)).toBe(true);
    });

    it('should work with hexagonal topology (6 ports)', () => {
      const board = BoardFactory.fromLevelData(HEX_LEVEL);
      const h1 = board.getCell('h1')!;
      const h2 = board.getCell('h2')!;

      expect(h1.getPortCount()).toBe(6);
      expect(h1.getNeighborAtPort(2)).toBe(h2);
      expect(h2.getNeighborAtPort(5)).toBe(h1);
    });

    it('should build board with no connections (isolated cells)', () => {
      const data: LevelData = {
        id: 'isolated',
        name: 'Isolated',
        difficulty: 'EASY',
        cells: [{ id: 'solo', portCount: 4 }],
        connections: [],
      };
      const board = BoardFactory.fromLevelData(data);
      const solo = board.getCell('solo')!;

      for (let i = 0; i < 4; i++) {
        expect(solo.isExit(i)).toBe(true);
      }
    });
  });

  // ──────────────────────────────────────────
  // RECHAZOS DE TOPOLOGÍA INVÁLIDA
  // ──────────────────────────────────────────

  describe('fromLevelData — topology errors', () => {
    it('should reject a cell with odd port count', () => {
      const data: LevelData = {
        id: 'bad',
        name: 'Bad',
        difficulty: 'EASY',
        cells: [{ id: 'odd', portCount: 5 }],
        connections: [],
      };
      expect(() => BoardFactory.fromLevelData(data)).toThrow(
        'TopologyError: port count must be an even number'
      );
    });

    it('should reject self-connection declared in JSON', () => {
      const data: LevelData = {
        id: 'self',
        name: 'Self Loop',
        difficulty: 'EASY',
        cells: [{ id: 'loop', portCount: 4 }],
        connections: [{ fromCell: 'loop', fromPort: 0, toCell: 'loop', toPort: 2 }],
      };
      expect(() => BoardFactory.fromLevelData(data)).toThrow(
        'ConnectionError: a cell cannot connect to itself'
      );
    });

    it('should reject connection with out-of-range port index', () => {
      const data: LevelData = {
        id: 'oor',
        name: 'Out of Range',
        difficulty: 'EASY',
        cells: [
          { id: 'a', portCount: 4 },
          { id: 'b', portCount: 4 },
        ],
        connections: [{ fromCell: 'a', fromPort: 10, toCell: 'b', toPort: 0 }],
      };
      expect(() => BoardFactory.fromLevelData(data)).toThrow(
        'TopologyError: port index out of range'
      );
    });

    it('should reject connection referencing a non-existent fromCell', () => {
      const data: LevelData = {
        id: 'missing',
        name: 'Missing Cell',
        difficulty: 'EASY',
        cells: [{ id: 'a', portCount: 4 }],
        connections: [{ fromCell: 'ghost', fromPort: 0, toCell: 'a', toPort: 0 }],
      };
      expect(() => BoardFactory.fromLevelData(data)).toThrow(
        "BoardFactoryError: cell 'ghost' referenced in connections not found in cells"
      );
    });

    it('should reject connection referencing a non-existent toCell', () => {
      const data: LevelData = {
        id: 'missing2',
        name: 'Missing Cell 2',
        difficulty: 'EASY',
        cells: [{ id: 'a', portCount: 4 }],
        connections: [{ fromCell: 'a', fromPort: 0, toCell: 'phantom', toPort: 0 }],
      };
      expect(() => BoardFactory.fromLevelData(data)).toThrow(
        "BoardFactoryError: cell 'phantom' referenced in connections not found in cells"
      );
    });

    it('should reject duplicate cell IDs', () => {
      const data: LevelData = {
        id: 'dup',
        name: 'Duplicate',
        difficulty: 'EASY',
        cells: [
          { id: 'same', portCount: 4 },
          { id: 'same', portCount: 4 },
        ],
        connections: [],
      };
      expect(() => BoardFactory.fromLevelData(data)).toThrow(
        'BoardRegistryError: cell ID already exists in this board'
      );
    });
  });
});
