import { buildCubeTopology } from '../../src/presentation/game/cube/cubeTopology';
import {
  ARROW_LIFT,
  buildCubeRenderModel,
  cubeSizeFromNet,
} from '../../src/presentation/game/cube/cubeRenderModel';
import type { BoardViewModel } from '../../src/presentation/viewModel';

/**
 * MODO CUBO — proyección pura (topología + viewModel) → datos 3D del renderer.
 * La misma fuente que el SVG (BoardViewModel del GameController), sin three.
 */
describe('cubeRenderModel', () => {
  const topo = buildCubeTopology(3);

  function vmCells(excludeIds: string[] = []): BoardViewModel['cells'] {
    const excluded = new Set(excludeIds);
    return topo.cells
      .filter((c) => !excluded.has(c.id))
      .map((c) => ({ id: c.id, col: c.col, row: c.row, layer: c.layer }));
  }

  describe('cubeSizeFromNet', () => {
    it('deduce S de la extensión 4S×3S de la cruz', () => {
      expect(cubeSizeFromNet(vmCells())).toBe(3);
      expect(cubeSizeFromNet(buildCubeTopology(5).cells)).toBe(5);
    });

    it('rechaza extensiones que no son una cruz', () => {
      expect(() => cubeSizeFromNet([{ col: 4, row: 2 }])).toThrow(RangeError);
      expect(() => cubeSizeFromNet([])).toThrow(RangeError);
    });
  });

  describe('tiles y agujeros', () => {
    it('separa celdas presentes (tiles) de ausentes (holes, el agujero negro)', () => {
      const board: BoardViewModel = { cells: vmCells(['4,1']), arrows: [] };
      const model = buildCubeRenderModel(topo, board);

      expect(model.tiles).toHaveLength(53);
      expect(model.holes).toHaveLength(1);
      expect(model.holes[0].id).toBe('4,1');
      // El hueco conserva su posición 3D de la topología (interior de arriba).
      expect(model.holes[0].center).toEqual(topo.cellById.get('4,1')!.center);
      expect(model.holes[0].normal).toEqual({ x: 0, y: 1, z: 0 });
    });

    it('cada tile lleva el marco (u, v, normal) de su cara para orientar la geometría', () => {
      const model = buildCubeRenderModel(topo, { cells: vmCells(), arrows: [] });
      const front = model.tiles.find((t) => t.id === '4,4')!; // front(1,1)
      expect(front.normal).toEqual({ x: 0, y: 0, z: 1 });
      expect(front.u).toEqual({ x: 1, y: 0, z: 0 });
      expect(front.layer).toBe(0);
    });
  });

  describe('flechas', () => {
    it('eleva la polilínea sobre la piel del cubo siguiendo la normal de CADA cara', () => {
      // Flecha cruzando frente→arriba: "4,3" (front, normal +z) → "4,2" (top, normal +y).
      const board: BoardViewModel = {
        cells: vmCells(),
        arrows: [{ id: 'a1', color: '#f00', cellIds: ['4,3', '4,2'], exitDir: 0 }],
      };
      const model = buildCubeRenderModel(topo, board);
      const [p0, p1] = model.arrows[0].points;

      expect(p0.z).toBeCloseTo(3 + ARROW_LIFT, 10); // elevada en +z (frente)
      expect(p1.y).toBeCloseTo(3 + ARROW_LIFT, 10); // elevada en +y (arriba)
    });

    it('la punta visual es el ÚLTIMO punto y su dirección cruza la arista', () => {
      const board: BoardViewModel = {
        cells: vmCells(),
        arrows: [{ id: 'a1', color: '#f00', cellIds: ['4,3', '4,2'], exitDir: 0 }],
      };
      const { tipPos, tipDir } = buildCubeRenderModel(topo, board).arrows[0];

      expect(tipPos).toEqual(buildCubeRenderModel(topo, board).arrows[0].points[1]);
      // De la cara frontal hacia la de arriba: sube (+y) y se hunde (−z).
      expect(tipDir.y).toBeGreaterThan(0);
      expect(tipDir.z).toBeLessThan(0);
      expect(Math.abs(tipDir.x)).toBeLessThan(1e-10);
      expect(Math.hypot(tipDir.x, tipDir.y, tipDir.z)).toBeCloseTo(1, 10);
    });

    it('flecha de una sola celda: la dirección sale del exitPort proyectado en el marco de su cara', () => {
      // front(1,1) = "4,4", exitDir 1 (Este) → dirección 3D = u del frente = +x.
      const board: BoardViewModel = {
        cells: vmCells(),
        arrows: [{ id: 'a1', color: '#f00', cellIds: ['4,4'], exitDir: 1 }],
      };
      const { tipDir } = buildCubeRenderModel(topo, board).arrows[0];
      expect(tipDir).toEqual({ x: 1, y: 0, z: 0 });
    });

    it('conserva id y color, y omite celdas fuera de topología sin reventar', () => {
      const board: BoardViewModel = {
        cells: vmCells(),
        arrows: [{ id: 'azul', color: '#3b82f6', cellIds: ['fuera', '4,4'], exitDir: 2 }],
      };
      const model = buildCubeRenderModel(topo, board);
      expect(model.arrows[0].id).toBe('azul');
      expect(model.arrows[0].color).toBe('#3b82f6');
      expect(model.arrows[0].points).toHaveLength(1);
    });
  });
});
