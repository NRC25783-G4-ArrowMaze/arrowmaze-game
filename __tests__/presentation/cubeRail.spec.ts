import {
  CubeRailAnimator,
  buildDevourRail,
  dirAtNode,
  pointAtNode,
  recoilOffset,
  sampleDevourShape,
  sampleShapeOnRailNodes,
} from '../../src/presentation/game/cube/cubeRail';
import type { Vec3 } from '../../src/presentation/game/cube/cubeTopology';
import { GLIDE_SPEED } from '../../src/presentation/rendering/glideConfig';

/**
 * MODO CUBO — el riel 3D: puerto del modelo 2D (riel persistente + un offset)
 * parametrizado por NODOS para que la forma en reposo calce con los centros
 * aunque los tramos de arista midan √½.
 */

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** Riel con doblez de ARISTA real (frente→arriba del mini-cubo, S=3). */
const FOLD_RAIL: Vec3[] = [
  v(1.5, 0.5, 3), // front, dos abajo
  v(1.5, 1.5, 3), // front
  v(1.5, 2.5, 3), // front, borde
  v(1.5, 3, 2.5), // top (¡dobla la arista!)
  v(1.5, 3, 1.5), // top
];

describe('cubeRail — muestreo por nodos', () => {
  it('en posiciones enteras devuelve exactamente los nodos (forma en reposo = centros)', () => {
    expect(pointAtNode(FOLD_RAIL, 0)).toEqual(FOLD_RAIL[0]);
    expect(pointAtNode(FOLD_RAIL, 3)).toEqual(FOLD_RAIL[3]);
    expect(pointAtNode(FOLD_RAIL, 4)).toEqual(FOLD_RAIL[4]);
  });

  it('interpola dentro del tramo y clampea fuera del riel', () => {
    expect(pointAtNode(FOLD_RAIL, 0.5)).toEqual(v(1.5, 1.0, 3));
    expect(pointAtNode(FOLD_RAIL, -5)).toEqual(FOLD_RAIL[0]);
    expect(pointAtNode(FOLD_RAIL, 99)).toEqual(FOLD_RAIL[4]);
  });

  it('la dirección en el nodo exacto de la arista es la SALIENTE (gira justo al doblar)', () => {
    // Tramo 1→2 sube por el frente (+y); tramo 2→3 cruza la arista (+y, −z).
    const before = dirAtNode(FOLD_RAIL, 1.5);
    expect(before.y).toBeCloseTo(1, 10);
    const atFold = dirAtNode(FOLD_RAIL, 2); // nodo exacto → tramo saliente
    expect(atFold.y).toBeGreaterThan(0);
    expect(atFold.z).toBeLessThan(0);
    const after = dirAtNode(FOLD_RAIL, 3); // ya en la cara de arriba → −z puro
    expect(after.z).toBeCloseTo(-1, 10);
    expect(after.y).toBeCloseTo(0, 10);
  });

  it('la ventana incluye los nodos interiores: el cuerpo DOBLA la arista sin cortar', () => {
    // Ventana de 3 vértices con offset 0.5: cubre [0.5, 2.5] — el nodo 2
    // (borde del frente) queda dentro y debe aparecer en el cuerpo.
    const s = sampleShapeOnRailNodes(FOLD_RAIL, 0.5, 3);
    expect(s.vertices).toHaveLength(3);
    expect(s.body.length).toBeGreaterThan(2); // trasero + esquina interior + punta
    expect(s.body).toContainEqual(FOLD_RAIL[2]);
  });
});

describe('CubeRailAnimator — retarget suave y snap silencioso', () => {
  const centers0 = [FOLD_RAIL[0], FOLD_RAIL[1]]; // flecha de 2 celdas en el frente

  it('avanza a velocidad constante (paridad GLIDE_SPEED con el 2D) hasta el target', () => {
    const anim = new CubeRailAnimator(centers0);
    expect(anim.settled).toBe(true);

    // El dominio avanza un paso: [1] → [2] (la punta toma el borde).
    const advanced = anim.retarget([FOLD_RAIL[1], FOLD_RAIL[2]]);
    expect(advanced).toBe(true);
    expect(anim.settled).toBe(false);

    // Medio paso de tiempo → medio nodo recorrido.
    anim.tick(0.5 / GLIDE_SPEED);
    const mid = anim.sample();
    expect(mid.vertices[1].y).toBeCloseTo(2.0, 6); // punta a mitad de camino 1.5→2.5

    anim.tick(10); // sobra tiempo: clampea en el target
    expect(anim.settled).toBe(true);
    expect(anim.sample().vertices).toEqual([FOLD_RAIL[1], FOLD_RAIL[2]]);
  });

  it('continuidad C0 en el retarget: muestrear el mismo offset no mueve la forma', () => {
    const anim = new CubeRailAnimator(centers0);
    anim.retarget([FOLD_RAIL[1], FOLD_RAIL[2]]);
    anim.tick(0.3 / GLIDE_SPEED);
    const before = anim.sample();

    // Retarget encadenado ANTES de asentarse (cruza la arista): el target es
    // siempre entero, así que el apéndice por delante procede en pleno vuelo.
    const advanced = anim.retarget([FOLD_RAIL[2], FOLD_RAIL[3]]);
    expect(advanced).toBe(true);

    // Continuidad C0: extender el riel por delante NO mueve la forma actual.
    const after = anim.sample();
    after.vertices.forEach((p, i) => {
      expect(p.x).toBeCloseTo(before.vertices[i].x, 10);
      expect(p.y).toBeCloseTo(before.vertices[i].y, 10);
      expect(p.z).toBeCloseTo(before.vertices[i].z, 10);
    });
  });

  it('retarget encadenado con target entero extiende el riel sin snap (aristas sin corte)', () => {
    const anim = new CubeRailAnimator(centers0);
    anim.retarget([FOLD_RAIL[1], FOLD_RAIL[2]]);
    anim.tick(10); // asienta (offset = target = 1, entero)
    const advanced = anim.retarget([FOLD_RAIL[2], FOLD_RAIL[3]]); // dobla la arista
    expect(advanced).toBe(true);
    anim.tick(10);
    expect(anim.sample().vertices).toEqual([FOLD_RAIL[2], FOLD_RAIL[3]]);
  });

  it('retarget IDÉNTICO (restore del modo return) es no-op: sin snap, sin salto', () => {
    const anim = new CubeRailAnimator(centers0);
    anim.retarget([FOLD_RAIL[1], FOLD_RAIL[2]]);
    anim.tick(10); // asentada en la nueva posición
    const before = anim.sample();

    const smooth = anim.retarget([FOLD_RAIL[1], FOLD_RAIL[2]]);
    expect(smooth).toBe(true);
    expect(anim.settled).toBe(true);
    expect(anim.sample().vertices).toEqual(before.vertices);
  });

  it('RETROCESO de un paso (glide de regreso): target baja y el offset lo persigue hacia atrás', () => {
    const anim = new CubeRailAnimator(centers0);
    anim.retarget([FOLD_RAIL[1], FOLD_RAIL[2]]); // ida
    anim.tick(10);

    // El hook re-proyecta la forma corrida UN paso hacia atrás (regreso).
    const smooth = anim.retarget([FOLD_RAIL[0], FOLD_RAIL[1]]);
    expect(smooth).toBe(true);
    expect(anim.settled).toBe(false);

    anim.tick(0.5 / GLIDE_SPEED); // medio paso de VUELTA
    const mid = anim.sample();
    expect(mid.vertices[1].y).toBeCloseTo(2.0, 6); // punta desandando 2.5→1.5

    anim.tick(10);
    expect(anim.settled).toBe(true);
    expect(anim.sample().vertices).toEqual([FOLD_RAIL[0], FOLD_RAIL[1]]);
  });

  it('la vuelta DESANDA la arista por el mismo riel (pliegue en reversa, sin corte)', () => {
    // Ida hasta cruzar la arista, luego regreso completo paso a paso.
    const anim = new CubeRailAnimator([FOLD_RAIL[1], FOLD_RAIL[2]]);
    anim.retarget([FOLD_RAIL[2], FOLD_RAIL[3]]); // cruza la arista
    anim.tick(10);

    expect(anim.retarget([FOLD_RAIL[1], FOLD_RAIL[2]])).toBe(true); // paso atrás
    anim.tick(0.5 / GLIDE_SPEED);
    const mid = anim.sample();
    // A mitad del regreso la punta está desandando el pliegue: sigue teniendo
    // componente en las DOS caras (y entre los nodos 2 y 3 del riel).
    expect(mid.vertices[1].y).toBeGreaterThan(2.5);
    expect(mid.vertices[1].z).toBeLessThanOrEqual(3);

    anim.tick(10);
    expect(anim.sample().vertices).toEqual([FOLD_RAIL[1], FOLD_RAIL[2]]);
  });

  it('cualquier proyección que no sea "un paso" hace snap silencioso (jamás revienta)', () => {
    const anim = new CubeRailAnimator(centers0);
    // La flecha se encogió (devorado parcial) → snap al estado real.
    const advanced = anim.retarget([FOLD_RAIL[3]]);
    expect(advanced).toBe(false);
    expect(anim.settled).toBe(true);
    expect(anim.sample().vertices).toEqual([FOLD_RAIL[3]]);
  });
});

describe('recoil — el empujón del bloqueo', () => {
  it('es un pulso: cero en los extremos, máximo a mitad, siempre no-negativo', () => {
    expect(recoilOffset(0)).toBe(0);
    expect(recoilOffset(1)).toBe(0);
    expect(recoilOffset(0.5)).toBeGreaterThan(0);
    expect(recoilOffset(0.25)).toBeLessThan(recoilOffset(0.5));
    expect(recoilOffset(-1)).toBe(0);
    expect(recoilOffset(2)).toBe(0);
  });
});

describe('devorado — estiramiento hacia el centro + fade', () => {
  const CENTER = v(1.5, 1.5, 1.5);
  const shape = [FOLD_RAIL[2], FOLD_RAIL[3]]; // forma visible al morir

  it('t=0: la forma es exactamente la visible, opacidad plena', () => {
    const rail = buildDevourRail(shape, CENTER);
    const s = sampleDevourShape(rail, 0, shape.length);
    expect(s.vertices).toEqual(shape);
    expect(s.opacity).toBe(1);
  });

  it('a mitad de camino la flecha se ESTIRA: la punta corre más que la cola', () => {
    const rail = buildDevourRail(shape, CENTER);
    const s0 = sampleDevourShape(rail, 0, shape.length);
    const sMid = sampleDevourShape(rail, 0.5, shape.length);

    const len = (a: Vec3, b: Vec3): number => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const restLen = len(s0.vertices[0], s0.vertices[1]);
    const midLen = len(sMid.vertices[0], sMid.vertices[1]);
    expect(midLen).toBeGreaterThan(restLen); // estiramiento visible
    expect(sMid.opacity).toBeLessThan(1);
    expect(sMid.opacity).toBeGreaterThan(0);
  });

  it('t=1: todo colapsa en el centro del cubo con opacidad 0', () => {
    const rail = buildDevourRail(shape, CENTER);
    const s = sampleDevourShape(rail, 1, shape.length);
    for (const p of s.vertices) {
      expect(p.x).toBeCloseTo(CENTER.x, 6);
      expect(p.y).toBeCloseTo(CENTER.y, 6);
      expect(p.z).toBeCloseTo(CENTER.z, 6);
    }
    expect(s.opacity).toBe(0);
  });

  it('la opacidad decrece monótonamente durante el devorado', () => {
    const rail = buildDevourRail(shape, CENTER);
    let prev = Infinity;
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const { opacity } = sampleDevourShape(rail, t, shape.length);
      expect(opacity).toBeLessThanOrEqual(prev);
      prev = opacity;
    }
  });
});
