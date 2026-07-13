import type { Scene, SceneArrow } from '../scene';
import { buildCubeTopology } from '../cube/cubeTopology';

/**
 * SINGULARIDAD — El GRAN FINAL del mapa (post-Corazón): el primer nivel CUBO
 * jugable del juego normal.
 *
 * Cubo 5×5 con agujero negro 2×2 en la cara de arriba. Trece flechas — mezcla
 * de cortas (3) y largas (6), todas con curvas y/o cruces de arista — pensadas
 * para un jugador real: la primera ola se descubre en la cara superior; las
 * demás obligan a ROTAR el cubo (el descubrimiento es parte de la experiencia)
 * y la última entra desde la cara de abajo con un rayo que cruza dos aristas.
 *
 * Método constructivo de la casa (la secuencia primero): cada tip llega
 * ALINEADO a su carril hacia el agujero; toda flecha muere en el agujero
 * dentro de la secuencia. El replay contra el motor real y el cálculo de los
 * umbrales de estrellas viven en localLevels.spec.
 *
 * Cruz S=5 — netOrigins: left(0,5) front(5,5) right(10,5) back(15,5)
 * top(5,0) bottom(5,10). Agujero: top(1..2, 1..2).
 */

const S = 5;

export const SINGULARIDAD_HOLE_IDS = ['6,1', '7,1', '6,2', '7,2'];

/** Cadenas cabeza→punta (la punta visual es la ÚLTIMA celda). */
const SNAKES: Array<{ id: string; color: string; chain: string[] }> = [
  // ── OLA 1: descubribles rotando apenas — tips a 1 celda del agujero ──
  // Baja recta por la cara TRASERA y cruza al tablero.
  { id: 'cometa', color: '#3b82f6', chain: ['18,7', '18,6', '18,5', '6,0'] },
  // Gancho en la trasera, un carril al lado.
  { id: 'pulsar', color: '#22c55e', chain: ['16,6', '17,6', '17,5', '7,0'] },
  // Sube por la IZQUIERDA y entra de costado.
  { id: 'quasar', color: '#f97316', chain: ['1,7', '1,6', '1,5', '5,1'] },
  // Gancho en la izquierda, fila de abajo.
  { id: 'nova', color: '#ec4899', chain: ['3,6', '2,6', '2,5', '5,2'] },
  // Serpiente del FRENTE que dobla la arista y sube al agujero.
  { id: 'orbita', color: '#8b5cf6', chain: ['7,6', '6,6', '6,5', '6,4', '6,3'] },
  // S-curva del frente, carril vecino.
  { id: 'eclipse', color: '#06b6d4', chain: ['8,7', '8,6', '8,5', '7,5', '7,4', '7,3'] },
  // Baja por la DERECHA y entra por el este.
  { id: 'meteoro', color: '#f59e0b', chain: ['13,7', '13,6', '13,5', '9,1', '8,1'] },
  // Gancho de la derecha, fila de abajo.
  { id: 'aurora', color: '#84cc16', chain: ['11,6', '12,6', '12,5', '9,2', '8,2'] },

  // ── OLA 2: lo profundo — rayos que cruzan el pliegue por carriles vaciados ──
  { id: 'vortice', color: '#fb7185', chain: ['17,9', '18,9', '18,8'] },
  { id: 'singular', color: '#14b8a6', chain: ['14,9', '13,9', '13,8'] },
  { id: 'gravedad', color: '#a855f7', chain: ['6,9', '6,8', '7,8', '7,7'] },
  { id: 'colapso', color: '#ef4444', chain: ['1,9', '2,9', '2,8', '2,7'] },
  // Desde ABAJO: su rayo sube todo el frente y cruza DOS aristas.
  { id: 'horizonte', color: '#eab308', chain: ['5,12', '6,12', '6,11', '6,10'] },
];

/**
 * Secuencia ganadora: la ola 1 vacía los carriles directos; la ola 2 los
 * recorre desde lo profundo. Cada tap termina en 'destroyed'; 13 taps = WON.
 */
export const SINGULARIDAD_SOLVE_ORDER: string[] = [
  'cometa', 'pulsar', 'quasar', 'nova', 'orbita', 'eclipse', 'meteoro', 'aurora',
  'vortice', 'singular', 'gravedad', 'colapso', 'horizonte',
];

function buildScene(): Scene {
  const topo = buildCubeTopology(S);
  const holes = new Set(SINGULARIDAD_HOLE_IDS);

  const portTo = new Map<string, number>();
  for (const c of topo.connections) {
    portTo.set(`${c.fromCell}|${c.toCell}`, c.fromPort);
    portTo.set(`${c.toCell}|${c.fromCell}`, c.toPort);
  }

  const occupied = new Set<string>();
  const arrows: SceneArrow[] = SNAKES.map(({ id, color, chain }) => {
    for (let k = 0; k < chain.length - 1; k++) {
      if (!portTo.has(`${chain[k]}|${chain[k + 1]}`)) {
        throw new Error(`SINGULARIDAD: cadena rota en ${id}: ${chain[k]} → ${chain[k + 1]}`);
      }
    }
    for (const cellId of chain) {
      if (holes.has(cellId) || occupied.has(cellId)) {
        throw new Error(`SINGULARIDAD: ${id} pisa celda inválida u ocupada: ${cellId}`);
      }
      occupied.add(cellId);
    }
    return {
      id,
      color,
      head: { cellId: chain[0], exitPort: portTo.get(`${chain[0]}|${chain[1]}`)! },
      body: chain.slice(1),
    };
  });

  return {
    id: 'singularidad',
    name: 'Singularidad',
    mapMode: 'cube',
    allowedMoves: SNAKES.length,
    collisionBehavior: 'return',
    cells: topo.cells
      .filter((c) => !holes.has(c.id))
      .map((c) => ({ id: c.id, col: c.col, row: c.row, portCount: 4, layer: c.layer })),
    connections: topo.connections.filter(
      (c) => !holes.has(c.fromCell) && !holes.has(c.toCell),
    ),
    arrows,
  };
}

export const LEVEL_SINGULARIDAD: Scene = buildScene();
