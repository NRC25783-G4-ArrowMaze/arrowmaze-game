import type { Scene } from '../scene';
import { buildCubeTopology } from '../cube/cubeTopology';

/**
 * LEVEL_CUBE_SAMPLE — Muestra del MODO CUBO para playtest (Fase 3).
 *
 * Cubo de caras 4×4 con agujero negro 2×2 en el interior de la cara de
 * ARRIBA (celdas de la cruz "5,1" "6,1" "5,2" "6,2" eliminadas: sus puertos
 * circundantes quedan sin conexión = sumideros del dominio).
 *
 * Flechas pensadas para ejercitar cada interacción del playtest:
 *  - roja    ("5,4" N): cruza la arista frente→arriba y cae al agujero (2 ticks).
 *  - azul    ("9,4" N): cruza la arista DOBLADA derecha→arriba y cae (2 ticks).
 *  - verde   ("5,5" S): la vuelta grande — frente→abajo→atrás→arriba y muere
 *    en el agujero por el otro lado (15 ticks, cruza 3 aristas).
 *  - naranja ("6,6" N): su rayo va al agujero pero el muro la bloquea → rebote
 *    y regreso (modo 'return').
 *  - muro    ("6,3"→"6,4"): flecha tendida A TRAVÉS de la arista frente/arriba;
 *    al jugarla avanza 1 y la bloquea naranja → regreso cruzando la arista.
 *
 * Todos los rayos TERMINAN (agujero o bloqueo): en una superficie cerrada un
 * rayo sin obstáculo orbita infinito, así que cada flecha de un nivel cubo
 * debe morir en el agujero o en un bloqueo — restricción de diseño clave para
 * el nivel demo (Fase 6).
 *
 * No está en LEVEL_MAP: se juega vía la entrada dev (?level=cubo-sample).
 */

const HOLE_CELL_IDS = new Set(['5,1', '6,1', '5,2', '6,2']);

function buildScene(): Scene {
  const topo = buildCubeTopology(4);
  return {
    id: 'cubo-sample',
    name: 'Cubo — muestra',
    mapMode: 'cube',
    allowedMoves: 12,
    collisionBehavior: 'return',
    cells: topo.cells
      .filter((c) => !HOLE_CELL_IDS.has(c.id))
      .map((c) => ({ id: c.id, col: c.col, row: c.row, portCount: 4, layer: c.layer })),
    connections: topo.connections.filter(
      (c) => !HOLE_CELL_IDS.has(c.fromCell) && !HOLE_CELL_IDS.has(c.toCell),
    ),
    arrows: [
      { id: 'roja', color: '#fb7185', head: { cellId: '5,4', exitPort: 0 }, body: [] },
      { id: 'azul', color: '#3b82f6', head: { cellId: '9,4', exitPort: 0 }, body: [] },
      { id: 'verde', color: '#22c55e', head: { cellId: '5,5', exitPort: 2 }, body: [] },
      { id: 'naranja', color: '#f97316', head: { cellId: '6,6', exitPort: 0 }, body: [] },
      { id: 'muro', color: '#8b5cf6', head: { cellId: '6,3', exitPort: 2 }, body: ['6,4'] },
    ],
  };
}

export const LEVEL_CUBE_SAMPLE: Scene = buildScene();
