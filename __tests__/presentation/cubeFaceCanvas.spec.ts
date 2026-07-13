import { buildCubeTopology } from '../../src/presentation/game/cube/cubeTopology';
import {
  faceIndexOfPoint,
  projectToFace,
  projectDirToFace,
  sharedEdgeSegment,
  splitBodyByFace,
  warpToPieceCenters,
} from '../../src/presentation/game/cube/cubeFaceCanvas';
import { ARROW_LIFT } from '../../src/presentation/game/cube/cubeRenderModel';
import type { Vec3 } from '../../src/presentation/game/cube/cubeTopology';

/**
 * MODO CUBO — pintado por cara: la polilínea del glifo se parte exactamente en
 * la arista y cada mitad cae en el lienzo de su cara (pliegue real, Opción A).
 */
describe('cubeFaceCanvas', () => {
  const topo = buildCubeTopology(3);
  const faces = topo.faces;
  const lift = (p: Vec3, n: Vec3): Vec3 => ({
    x: p.x + n.x * ARROW_LIFT,
    y: p.y + n.y * ARROW_LIFT,
    z: p.z + n.z * ARROW_LIFT,
  });

  it('proyecta centros de celda a coordenadas locales de su cara (unidades de celda)', () => {
    // front(1,0) = "4,3" → local (1.5, 0.5).
    const cell = topo.cellById.get('4,3')!;
    const local = projectToFace(faces[0], cell.center);
    expect(local.x).toBeCloseTo(1.5, 10);
    expect(local.y).toBeCloseTo(0.5, 10);
  });

  it('identifica la cara de un punto elevado (el lift no confunde el argmax)', () => {
    const front = topo.cellById.get('4,4')!; // front(1,1)
    const top = topo.cellById.get('4,1')!; // top(1,1)
    expect(faceIndexOfPoint(faces, lift(front.center, faces[0].normal))).toBe(0);
    expect(faceIndexOfPoint(faces, lift(top.center, faces[4].normal))).toBe(4);
  });

  it('parte una polilínea que cruza la arista frente→arriba en dos tramos que se encuentran en la arista', () => {
    // front(1,0) "4,3" → top(1,2) "4,2": cuerpo de dos puntos elevados.
    const a = lift(topo.cellById.get('4,3')!.center, faces[0].normal);
    const b = lift(topo.cellById.get('4,2')!.center, faces[4].normal);
    const runs = splitBodyByFace(faces, [a, b]);

    expect(runs).toHaveLength(2);
    expect(runs[0].faceIndex).toBe(0); // frente
    expect(runs[1].faceIndex).toBe(4); // arriba
    expect(runs[0].isLead).toBe(false);
    expect(runs[1].isLead).toBe(true);

    // El extremo del tramo del frente toca el borde superior de su lienzo
    // (v≈0) y el arranque del tramo de arriba toca su borde sur (v≈S)…
    const endFront = runs[0].points[runs[0].points.length - 1];
    const startTop = runs[1].points[0];
    expect(endFront.y).toBeLessThan(0.1);
    expect(startTop.y).toBeGreaterThan(2.9);
    // …y en la MISMA posición horizontal (continuidad del pliegue).
    expect(endFront.x).toBeCloseTo(startTop.x, 6);
  });

  it('una polilínea dentro de una sola cara produce un único tramo lead', () => {
    const a = lift(topo.cellById.get('4,4')!.center, faces[0].normal);
    const b = lift(topo.cellById.get('4,5')!.center, faces[0].normal);
    const runs = splitBodyByFace(faces, [a, b]);
    expect(runs).toHaveLength(1);
    expect(runs[0].faceIndex).toBe(0);
    expect(runs[0].isLead).toBe(true);
    expect(runs[0].points).toHaveLength(2);
  });

  it('proyecta direcciones al marco local (la punta se orienta en el lienzo)', () => {
    // Dirección +x sobre el frente → local +x; sobre la cara de arriba → +x local también (u=+x).
    const d = projectDirToFace(faces[0], { x: 1, y: 0, z: 0 });
    expect(d.x).toBeCloseTo(1, 10);
    expect(d.y).toBeCloseTo(0, 10);
    // Subir por el frente (−y…? local v = −y ⇒ subir = v negativo).
    const up = projectDirToFace(faces[0], { x: 0, y: 1, z: 0 });
    expect(up.y).toBeCloseTo(-1, 10);
  });

  describe('warpToPieceCenters — pintado alineado a las tapas reales (v4.3)', () => {
    const SHIFT = 0.095;
    const S = 6;
    const warp = (x: number): number =>
      warpToPieceCenters({ x, y: 0 }, S, SHIFT).x;

    it('fija 0 y S: los empalmes del pliegue entre lienzos no se mueven', () => {
      expect(warp(0)).toBeCloseTo(0, 10);
      expect(warp(S)).toBeCloseTo(S, 10);
    });

    it('lleva los centros lógicos de borde al centro visual de su pieza', () => {
      expect(warp(0.5)).toBeCloseTo(0.5 - SHIFT, 10);
      expect(warp(S - 0.5)).toBeCloseTo(S - 0.5 + SHIFT, 10);
    });

    it('es identidad en el interior del tablero', () => {
      expect(warp(1.5)).toBeCloseTo(1.5, 10);
      expect(warp(3)).toBeCloseTo(3, 10);
      expect(warp(S - 1.5)).toBeCloseTo(S - 1.5, 10);
    });

    it('es continua y monótona (sin saltos ni pliegues del pintado)', () => {
      let prev = -Infinity;
      for (let x = 0; x <= S + 1e-9; x += 0.05) {
        const w = warp(x);
        expect(w).toBeGreaterThan(prev);
        prev = w;
      }
    });

    it('warpea ambos ejes de forma independiente (esquinas: doble corrimiento)', () => {
      const corner = warpToPieceCenters({ x: 0.5, y: S - 0.5 }, S, SHIFT);
      expect(corner.x).toBeCloseTo(0.5 - SHIFT, 10);
      expect(corner.y).toBeCloseTo(S - 0.5 + SHIFT, 10);
    });
  });

  describe('sharedEdgeSegment — la arista del pulso de cruce', () => {
    it('frente–arriba comparten la arista y=S, z=S a lo largo de x', () => {
      const edge = sharedEdgeSegment(faces[0], faces[4], 3)!;
      expect(edge.from).toEqual({ x: 0, y: 3, z: 3 });
      expect(edge.to).toEqual({ x: 3, y: 3, z: 3 });
    });

    it('arriba–atrás comparten la arista y=S, z=0', () => {
      const edge = sharedEdgeSegment(faces[4], faces[2], 3)!;
      expect(edge.from).toEqual({ x: 0, y: 3, z: 0 });
      expect(edge.to).toEqual({ x: 3, y: 3, z: 0 });
    });

    it('caras opuestas no comparten arista', () => {
      expect(sharedEdgeSegment(faces[0], faces[2], 3)).toBeNull();
    });
  });
});
