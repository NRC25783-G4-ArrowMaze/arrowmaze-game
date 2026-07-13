import { GameController } from '../../src/presentation/game/GameController';
import { buildCubeTopology } from '../../src/presentation/game/cube/cubeTopology';
import type { CubeTopology } from '../../src/presentation/game/cube/cubeTopology';
import type { Scene, SceneArrow } from '../../src/presentation/game/scene';

/**
 * MODO CUBO — el motor REAL mastica la superficie del cubo.
 *
 * Estos tests no tocan el dominio: construyen la Scene 'cube' desde
 * buildCubeTopology y la juegan con GameController (el mismo pipeline
 * Scene → toLevelDataDTO → LevelLoader → Board/Arrow de la UI).
 *
 * Cobertura:
 *  - el nivel cubo carga sin errores (relax condicional del builder activo);
 *  - una flecha CRUZA la arista frente→arriba y sigue avanzando (slide real);
 *  - EVIDENCIA del mecanismo del agujero negro: una salida es cualquier
 *    puerto sin conexión (Cell.isExit), también en el INTERIOR de una cara —
 *    quitar una celda interior crea un sumidero que devora y gana la partida.
 *
 *  - las aristas DOBLADAS (cableado no opuesto, p. ej. arriba↔atrás 0↔0):
 *    la flecha continúa alejándose de la arista porque el dominio honra el
 *    neighborPortIndex del grafo (decisión aprobada en Fase 1, ver
 *    doc/cubo-modo_hallazgos.md — Hallazgo 3);
 *  - los TRES ANILLOS ortogonales del cubo, que entre los tres recorren las
 *    12 aristas: una cabeza que viaja recta da la vuelta completa (4·S
 *    ticks) y regresa a su celda de origen.
 */

interface CubeSceneOptions {
  /** Celdas a eliminar (con sus conexiones) para abrir sumideros. */
  holeCellIds?: string[];
  arrows: SceneArrow[];
  allowedMoves?: number;
}

function cubeScene(topo: CubeTopology, options: CubeSceneOptions): Scene {
  const holes = new Set(options.holeCellIds ?? []);
  return {
    id: 'cube-mini',
    mapMode: 'cube',
    allowedMoves: options.allowedMoves ?? 5,
    cells: topo.cells
      .filter((c) => !holes.has(c.id))
      .map((c) => ({ id: c.id, col: c.col, row: c.row, portCount: 4, layer: c.layer })),
    connections: topo.connections.filter(
      (c) => !holes.has(c.fromCell) && !holes.has(c.toCell),
    ),
    arrows: options.arrows,
  };
}

/** Desliza hasta outcome terminal y consolida, igual que la UI y localLevels.spec. */
function slide(controller: GameController, arrowId: string): string | null {
  const maxTicks = 60;
  let outcome = controller.advanceTick(arrowId);
  for (let tick = 0; outcome === 'advanced' && tick < maxTicks; tick++) {
    outcome = controller.advanceTick(arrowId);
  }
  if (outcome !== null) {
    controller.commitSlide(outcome);
  }
  return outcome;
}

describe('MODO CUBO — mini-cubo 3×3 contra el GameController real', () => {
  const topo = buildCubeTopology(3);

  it('el nivel cubo completo (superficie cerrada, 54 celdas) carga en el motor sin errores', () => {
    const scene = cubeScene(topo, {
      arrows: [{ id: 'a1', color: '#3b82f6', head: { cellId: '4,4', exitPort: 0 }, body: [] }],
    });
    expect(() => new GameController(scene)).not.toThrow();
  });

  it('una flecha cruza la arista frente→arriba tick a tick (puertos opuestos 0↔2)', () => {
    // front(1,0) = "4,3"; su puerto N cruza la arista hacia top(1,2) = "4,2".
    const scene = cubeScene(topo, {
      arrows: [{ id: 'a1', color: '#3b82f6', head: { cellId: '4,3', exitPort: 0 }, body: [] }],
    });
    const controller = new GameController(scene);

    expect(controller.advanceTick('a1')).toBe('advanced');
    // La flecha vive ahora en la cara de ARRIBA (layer 4), celda "4,2".
    expect(controller.resolveArrowIdAt(4, 2)).toBe('a1');
    expect(controller.resolveArrowIdAt(4, 3)).toBeNull();

    // Y continúa recta sobre la cara nueva, alejándose de la arista.
    expect(controller.advanceTick('a1')).toBe('advanced');
    expect(controller.resolveArrowIdAt(4, 1)).toBe('a1');
  });

  it('EVIDENCIA agujero negro: un sumidero INTERIOR (celda quitada dentro de una cara) devora y gana', () => {
    // Se elimina top(1,1) = "4,1" — interior de la cara de arriba, lejos de
    // todo perímetro. Sus 4 vecinos quedan con un puerto sin conexión:
    // Cell.isExit === true ⇒ sumidero. La flecha sube desde el frente, cruza
    // la arista y cae en el agujero: 'destroyed' y la sesión se gana.
    const scene = cubeScene(topo, {
      holeCellIds: ['4,1'],
      arrows: [{ id: 'a1', color: '#3b82f6', head: { cellId: '4,3', exitPort: 0 }, body: [] }],
    });
    const controller = new GameController(scene);

    const outcome = slide(controller, 'a1');

    expect(outcome).toBe('destroyed');
    expect(controller.status).toBe('WON');
    expect(controller.score).not.toBeNull();
  });

  it('cruce de arista DOBLADA arriba→atrás (0↔0): la cabeza continúa, no rebota', () => {
    // top(1,0) = "4,0" puerto N cruza a back(1,0) = "10,3" puerto N (0↔0).
    // La continuación correcta es alejarse de la arista: "10,4", "10,5".
    const scene = cubeScene(topo, {
      arrows: [{ id: 'a1', color: '#3b82f6', head: { cellId: '4,0', exitPort: 0 }, body: [] }],
    });
    const controller = new GameController(scene);

    expect(controller.advanceTick('a1')).toBe('advanced');
    expect(controller.resolveArrowIdAt(10, 3)).toBe('a1');

    expect(controller.advanceTick('a1')).toBe('advanced');
    expect(controller.resolveArrowIdAt(10, 4)).toBe('a1');
    expect(controller.resolveArrowIdAt(4, 0)).toBeNull(); // no rebotó

    expect(controller.advanceTick('a1')).toBe('advanced');
    expect(controller.resolveArrowIdAt(10, 5)).toBe('a1');
  });

  it('una flecha cuyo CUERPO abarca una arista doblada se coloca y avanza coherente', () => {
    // Cabeza en top(1,0) = "4,0" apuntando por el puerto 0 hacia su cuerpo en
    // back(1,0) = "10,3" (colocación vía Arrow.extend a través del pliegue).
    // Al avanzar, la punta (cola) debe continuar hacia "10,4".
    const scene = cubeScene(topo, {
      arrows: [
        { id: 'a1', color: '#3b82f6', head: { cellId: '4,0', exitPort: 0 }, body: ['10,3'] },
      ],
    });
    const controller = new GameController(scene);

    expect(controller.advanceTick('a1')).toBe('advanced');
    // La cadena ocupa ahora ["10,3" (cabeza), "10,4" (punta)].
    expect(controller.resolveArrowIdAt(10, 3)).toBe('a1');
    expect(controller.resolveArrowIdAt(10, 4)).toBe('a1');
    expect(controller.resolveArrowIdAt(4, 0)).toBeNull();
  });

  describe('los tres anillos ortogonales recorren entre los tres las 12 aristas', () => {
    const RINGS: Array<{ name: string; start: string; exitPort: number; itinerary: string[] }> = [
      {
        // Aristas: frente-arriba, arriba-atrás, atrás-abajo, abajo-frente.
        name: 'anillo N-S (frente→arriba→atrás→abajo)',
        start: '4,3',
        exitPort: 0,
        itinerary: ['4,2', '4,1', '4,0', '10,3', '10,4', '10,5', '4,8', '4,7', '4,6', '4,5', '4,4', '4,3'],
      },
      {
        // Aristas: frente-derecha, derecha-atrás, atrás-izquierda, izquierda-frente.
        name: 'anillo ecuatorial (frente→derecha→atrás→izquierda)',
        start: '4,4',
        exitPort: 1,
        itinerary: ['5,4', '6,4', '7,4', '8,4', '9,4', '10,4', '11,4', '0,4', '1,4', '2,4', '3,4', '4,4'],
      },
      {
        // Aristas: arriba-derecha, derecha-abajo, abajo-izquierda, izquierda-arriba.
        name: 'anillo E-O (arriba→derecha→abajo→izquierda)',
        start: '4,1',
        exitPort: 1,
        itinerary: ['5,1', '7,3', '7,4', '7,5', '5,7', '4,7', '3,7', '1,5', '1,4', '1,3', '3,1', '4,1'],
      },
    ];

    it.each(RINGS)('$name: 12 ticks y regresa al origen', ({ start, exitPort, itinerary }) => {
      const scene = cubeScene(topo, {
        arrows: [{ id: 'a1', color: '#3b82f6', head: { cellId: start, exitPort }, body: [] }],
      });
      const controller = new GameController(scene);

      const visited: string[] = [];
      for (let tick = 0; tick < 12; tick++) {
        expect(controller.advanceTick('a1')).toBe('advanced');
        const cellIds = controller.viewModel().arrows.find((a) => a.id === 'a1')!.cellIds;
        visited.push(cellIds[0]);
      }

      expect(visited).toEqual(itinerary);
    });
  });

  it('una flecha CON CUERPO también cruza la arista y es devorada por el sumidero interior', () => {
    // Cabeza en front(1,1) = "4,4", cuerpo en front(1,0) = "4,3" (la punta
    // visual es la cola, como modela el dominio). Mismo agujero en "4,1".
    const scene = cubeScene(topo, {
      holeCellIds: ['4,1'],
      arrows: [
        { id: 'a1', color: '#3b82f6', head: { cellId: '4,4', exitPort: 0 }, body: ['4,3'] },
      ],
    });
    const controller = new GameController(scene);

    const outcome = slide(controller, 'a1');

    expect(outcome).toBe('destroyed');
    expect(controller.status).toBe('WON');
  });
});
