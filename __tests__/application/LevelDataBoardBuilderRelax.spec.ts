import { LevelDataBoardBuilder } from '../../src/application/services/LevelDataBoardBuilder';
import type { LevelDataDTO } from '../../src/application/dtos/LevelDataDTOs';
import { ConnectionError } from '../../src/domain/errors/BoardErrors';

/**
 * MODO CUBO / H2 — relax condicional de validateOppositePorts.
 *
 * La regla geométrica "los puertos conectados deben ser opuestos" es una
 * propiedad de las rejillas PLANAS. En niveles '3d' (capas apiladas) y 'cube'
 * (aristas dobladas de la superficie del cubo) esa regla es matemáticamente
 * insatisfacible, así que el builder la omite SOLO en esos modos. Estos specs
 * fijan ambos lados del contrato:
 *   - la regla SIGUE VIVA para niveles 2D (mapMode ausente o '2d');
 *   - un nivel 'cube'/'3d' con conexiones no opuestas construye, y el dominio
 *     sigue validando lo suyo (rango, puertos libres, no auto-conexión).
 */

function baseDTO(overrides: Partial<LevelDataDTO>): LevelDataDTO {
  return {
    id: 'relax-spec',
    allowedMoves: 5,
    cells: [
      { id: '0,0', portCount: 4 },
      { id: '1,0', portCount: 4 },
    ],
    connections: [],
    arrows: [],
    ...overrides,
  };
}

describe('LevelDataBoardBuilder — relax condicional de puertos opuestos', () => {
  const builder = new LevelDataBoardBuilder();

  describe('la regla de opuestos sigue viva en niveles 2D', () => {
    it('mapMode ausente: conexión no opuesta (1→0) es rechazada', () => {
      const dto = baseDTO({
        connections: [{ fromCell: '0,0', fromPort: 1, toCell: '1,0', toPort: 0 }],
      });
      expect(() => builder.build(dto)).toThrow(ConnectionError);
      expect(() => builder.build(dto)).toThrow(/opposite/);
    });

    it("mapMode '2d' explícito: conexión no opuesta también es rechazada", () => {
      const dto = baseDTO({
        mapMode: '2d',
        connections: [{ fromCell: '0,0', fromPort: 1, toCell: '1,0', toPort: 0 }],
      });
      expect(() => builder.build(dto)).toThrow(ConnectionError);
    });

    it('mapMode ausente: la conexión opuesta clásica (1→3) sigue construyendo', () => {
      const dto = baseDTO({
        connections: [{ fromCell: '0,0', fromPort: 1, toCell: '1,0', toPort: 3 }],
      });
      const board = builder.build(dto);
      expect(board.getCell('0,0')!.getNeighborAtPort(1)!.getId()).toBe('1,0');
    });
  });

  describe("mapMode 'cube': las conexiones de arista doblada llegan al dominio", () => {
    it('una conexión 0↔0 (arista arriba↔atrás del cubo) construye y queda cableada bidireccional', () => {
      const dto = baseDTO({
        mapMode: 'cube',
        connections: [{ fromCell: '0,0', fromPort: 0, toCell: '1,0', toPort: 0 }],
      });
      const board = builder.build(dto);

      const a = board.getCell('0,0')!;
      const b = board.getCell('1,0')!;
      expect(a.getConnection(0)).toEqual({ neighbor: b, neighborPortIndex: 0 });
      expect(b.getConnection(0)).toEqual({ neighbor: a, neighborPortIndex: 0 });
    });

    it('el dominio sigue validando lo suyo: puerto fuera de rango es rechazado', () => {
      const dto = baseDTO({
        mapMode: 'cube',
        connections: [{ fromCell: '0,0', fromPort: 7, toCell: '1,0', toPort: 0 }],
      });
      expect(() => builder.build(dto)).toThrow();
    });

    it('el dominio sigue validando lo suyo: un puerto ya ocupado es rechazado', () => {
      const dto = baseDTO({
        cells: [
          { id: '0,0', portCount: 4 },
          { id: '1,0', portCount: 4 },
          { id: '2,0', portCount: 4 },
        ],
        mapMode: 'cube',
        connections: [
          { fromCell: '0,0', fromPort: 1, toCell: '1,0', toPort: 0 },
          { fromCell: '0,0', fromPort: 1, toCell: '2,0', toPort: 0 },
        ],
      });
      expect(() => builder.build(dto)).toThrow();
    });

    it('la auto-conexión sigue prohibida', () => {
      const dto = baseDTO({
        mapMode: 'cube',
        connections: [{ fromCell: '0,0', fromPort: 0, toCell: '0,0', toPort: 2 }],
      });
      expect(() => builder.build(dto)).toThrow(ConnectionError);
    });

    it('geometrías distintas (portCount 4 vs 6) siguen sin poder conectar', () => {
      const dto = baseDTO({
        cells: [
          { id: '0,0', portCount: 4 },
          { id: '1,0', portCount: 6 },
        ],
        mapMode: 'cube',
        connections: [{ fromCell: '0,0', fromPort: 1, toCell: '1,0', toPort: 3 }],
      });
      expect(() => builder.build(dto)).toThrow(ConnectionError);
    });
  });

  describe("mapMode '3d': desbloquea de paso el contrato H2 (capas apiladas)", () => {
    it('conexiones planar 2→0 e inter-capa 4→5 con portCount 6 construyen (antes reventaban)', () => {
      const dto = baseDTO({
        mapMode: '3d',
        cells: [
          { id: '0,0', portCount: 6 },
          { id: '0,1', portCount: 6 },
          { id: '4,3', portCount: 6 },
        ],
        connections: [
          { fromCell: '0,0', fromPort: 2, toCell: '0,1', toPort: 0 },
          { fromCell: '0,1', fromPort: 4, toCell: '4,3', toPort: 5 },
        ],
      });
      const board = builder.build(dto);
      expect(board.getCell('0,1')!.getNeighborAtPort(4)!.getId()).toBe('4,3');
    });
  });
});
