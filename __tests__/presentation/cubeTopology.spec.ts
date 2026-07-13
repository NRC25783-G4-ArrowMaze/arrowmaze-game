import { buildCubeTopology } from '../../src/presentation/game/cube/cubeTopology';
import type { Vec3 } from '../../src/presentation/game/cube/cubeTopology';
import type { LevelConnectionDTO } from '../../src/presentation/game/scene';

/**
 * MODO CUBO — Topología de la superficie del cubo como dato.
 *
 * El tablero es la SUPERFICIE de un cubo: 6 caras S×S conectadas por sus 12
 * aristas. Cada cara es un valor de `layer` (0..5), todas las celdas tienen
 * portCount 4 (la superficie es una rejilla cuadrada 4-regular cerrada) y los
 * ids son coordenadas "col,row" de la cruz desplegada (cube net), de modo que
 * el pipeline existente (sceneFromLevelData, GameController) las digiere tal
 * cual. El cableado de las 12 aristas NO se teje a mano: se deriva del
 * embedding 3D de cada cara (celdas de borde cuyos puntos medios de arista
 * coinciden en el espacio se conectan), por lo que es correcto por
 * construcción. Estos tests fijan ese contrato con casos derivados a mano.
 *
 * Cruz desplegada (S = tamaño de cara), netOrigin de cada cara:
 *   top    (S, 0)
 *   left   (0, S)   front (S, S)   right (2S, S)   back (3S, S)
 *   bottom (S, 2S)
 */

/** Busca una conexión entre dos extremos concretos, en cualquier dirección. */
function findConn(
  conns: readonly LevelConnectionDTO[],
  cellA: string,
  portA: number,
  cellB: string,
  portB: number,
): LevelConnectionDTO | undefined {
  return conns.find(
    (c) =>
      (c.fromCell === cellA && c.fromPort === portA && c.toCell === cellB && c.toPort === portB) ||
      (c.fromCell === cellB && c.fromPort === portB && c.toCell === cellA && c.toPort === portA),
  );
}

function dist(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

describe('buildCubeTopology — el cubo como dato', () => {
  it('rechaza tamaños de cara inválidos con RangeError', () => {
    expect(() => buildCubeTopology(0)).toThrow(RangeError);
    expect(() => buildCubeTopology(-3)).toThrow(RangeError);
    expect(() => buildCubeTopology(2.5)).toThrow(RangeError);
  });

  describe('mini-cubo 3×3 (fixture de pruebas)', () => {
    const topo = buildCubeTopology(3);

    it('tiene los conteos exactos de una superficie cúbica S=3', () => {
      // 6 caras × 9 celdas
      expect(topo.cells).toHaveLength(54);
      // Intra-cara: 2·S·(S−1) por cara × 6 = 72. Aristas: 12·S = 36.
      expect(topo.edgeConnections).toHaveLength(36);
      expect(topo.connections).toHaveLength(108);
    });

    it('los ids son únicos, parsean como "col,row" y cada cara aporta S² celdas por layer', () => {
      const ids = new Set(topo.cells.map((c) => c.id));
      expect(ids.size).toBe(54);

      for (const cell of topo.cells) {
        const [col, row] = cell.id.split(',').map(Number);
        expect(col).toBe(cell.col);
        expect(row).toBe(cell.row);
      }

      for (let layer = 0; layer < 6; layer++) {
        expect(topo.cells.filter((c) => c.layer === layer)).toHaveLength(9);
      }
    });

    it('es una superficie CERRADA: cada puerto de cada celda participa en exactamente una conexión', () => {
      const used = new Map<string, number>();
      for (const conn of topo.connections) {
        for (const end of [`${conn.fromCell}:${conn.fromPort}`, `${conn.toCell}:${conn.toPort}`]) {
          used.set(end, (used.get(end) ?? 0) + 1);
        }
      }
      // 54 celdas × 4 puertos = 216 extremos, todos usados una sola vez.
      expect(used.size).toBe(216);
      for (const count of used.values()) {
        expect(count).toBe(1);
      }
    });

    it('cruce PLANO en la cruz: borde norte del frente ↔ borde sur de arriba (puertos opuestos 0↔2)', () => {
      // front(0,0) = "3,3" · top(0,2) = "3,2"
      expect(findConn(topo.edgeConnections, '3,3', 0, '3,2', 2)).toBeDefined();
    });

    it('cruce DOBLADO con índice invertido: derecha ↔ arriba (puertos 0↔1, no opuestos)', () => {
      // right(0,0) = "6,3" puerto N ↔ top(2,2) = "5,2" puerto E
      expect(findConn(topo.edgeConnections, '6,3', 0, '5,2', 1)).toBeDefined();
    });

    it('cruce DOBLADO arriba ↔ atrás: índice invertido y puertos 0↔0 (mismo número)', () => {
      // top(0,0) = "3,0" puerto N ↔ back(2,0) = "11,3" puerto N
      expect(findConn(topo.edgeConnections, '3,0', 0, '11,3', 0)).toBeDefined();
    });

    it('cruce DOBLADO atrás ↔ izquierda: mismo índice, puertos opuestos 1↔3 (cierre del anillo)', () => {
      // back(2,1) = "11,4" puerto E ↔ left(0,1) = "0,4" puerto O
      expect(findConn(topo.edgeConnections, '11,4', 1, '0,4', 3)).toBeDefined();
    });

    it('invariante geométrica: vecinos intra-cara a distancia 1, vecinos de arista a √½ y en caras distintas', () => {
      const byId = topo.cellById;
      const edgeSet = new Set(topo.edgeConnections);

      for (const conn of topo.connections) {
        const a = byId.get(conn.fromCell);
        const b = byId.get(conn.toCell);
        expect(a).toBeDefined();
        expect(b).toBeDefined();

        const d = dist(a!.center, b!.center);
        if (edgeSet.has(conn)) {
          // Al doblar la arista, los centros quedan a 0.5 + 0.5 en ángulo recto.
          expect(d).toBeCloseTo(Math.SQRT1_2, 10);
          expect(a!.layer).not.toBe(b!.layer);
        } else {
          expect(d).toBeCloseTo(1, 10);
          expect(a!.layer).toBe(b!.layer);
        }
      }
    });

    it('el embedding 3D vive en la piel del cubo [0,S]³: toda celda tiene exactamente una coordenada en 0 o S', () => {
      for (const cell of topo.cells) {
        const { x, y, z } = cell.center;
        const onSkin = [x, y, z].filter((v) => v === 0 || v === 3);
        expect(onSkin).toHaveLength(1);
      }
    });
  });

  it('el motor de datos escala a caras 10×10 (requisito del diseño)', () => {
    const topo = buildCubeTopology(10);
    expect(topo.cells).toHaveLength(600);
    expect(topo.edgeConnections).toHaveLength(120);
    expect(topo.connections).toHaveLength(1200);

    // Superficie cerrada también a este tamaño.
    const used = new Set<string>();
    for (const conn of topo.connections) {
      used.add(`${conn.fromCell}:${conn.fromPort}`);
      used.add(`${conn.toCell}:${conn.toPort}`);
    }
    expect(used.size).toBe(2400);
  });
});
