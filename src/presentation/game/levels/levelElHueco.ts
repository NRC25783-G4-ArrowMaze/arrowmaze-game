import type { Scene, SceneArrow } from '../scene';
import { buildCubeTopology } from '../cube/cubeTopology';

/**
 * EL HUECO — Nivel showcase del MODO CUBO (Fase 6).
 *
 * Cubo de caras 6×6 con agujero negro 2×2 en el centro de la cara de ARRIBA
 * (celdas "8,2" "9,2" "8,3" "9,3" de la cruz). Doce serpientes largas y
 * curvas — todas con cuerpo multi-celda, la mayoría cruzando aristas — que
 * mueren TODAS en el agujero siguiendo la secuencia ganadora.
 *
 * MÉTODO CONSTRUCTIVO (la secuencia primero, el tablero después):
 * - El rayo de una flecha es la dirección de su ÚLTIMO segmento: cada tip
 *   llega ALINEADO a su carril hacia el agujero (el cuerpo puede serpentear
 *   lo que quiera por detrás).
 * - 8 carriles hacia el agujero (2 columnas + 2 filas de la cara de arriba,
 *   por ambos lados). Primera ola: tips en la cara de arriba, a 1 celda del
 *   agujero. Segunda ola (carriles de columna): tips al OTRO lado de la
 *   arista (caras atrás/frente) — su rayo cruza el pliegue y recorre el
 *   carril que la primera ola dejó libre.
 * - Regla de superficie cerrada: toda flecha muere en el agujero dentro de
 *   la secuencia (12 taps = 12 devoradas = WON). El replay contra el motor
 *   real vive en localLevels.spec.
 *
 * Cruz S=6 — netOrigins: left(0,6) front(6,6) right(12,6) back(18,6)
 * top(6,0) bottom(6,12).
 */

const S = 6;

export const HOLE_CELL_IDS = ['8,2', '9,2', '8,3', '9,3'];

/**
 * Cadenas cabeza→punta (la punta visual es la ÚLTIMA celda).
 *
 * 24 serpientes = 8 carriles × 3 OLAS: la ola 1 con tips en la cara de
 * arriba, la ola 2 con tips al otro lado de la arista (su rayo cruza el
 * pliegue), la ola 3 aún más profunda en las caras laterales — incluida
 * 'gargola', que entra desde la cara de ABAJO y su rayo cruza DOS aristas.
 * Mezcla deliberada de cortas (3 celdas) y largas (5-7) con dobleces
 * constantes, para estresar el riel en todos los sabores.
 */
const SNAKES: Array<{ id: string; color: string; chain: string[] }> = [
  // ── OLA 1: tips en la cara de arriba, pegados al agujero ──
  { id: 'anguila', color: '#3b82f6', chain: ['1,6', '0,6', '6,0', '7,0', '8,0', '8,1'] },
  { id: 'sierpe', color: '#22c55e', chain: ['16,7', '16,6', '11,1', '11,0', '10,0', '9,0', '9,1'] },
  { id: 'caracol', color: '#f97316', chain: ['6,8', '6,7', '6,6', '6,5', '7,5', '8,5', '8,4'] },
  { id: 'dragon', color: '#ec4899', chain: ['13,7', '13,6', '11,4', '11,5', '10,5', '9,5', '9,4'] },
  { id: 'orca', color: '#8b5cf6', chain: ['2,6', '6,2', '7,2'] },
  { id: 'vibora', color: '#06b6d4', chain: ['4,7', '4,6', '3,6', '6,3', '7,3'] },
  { id: 'grifo', color: '#f59e0b', chain: ['15,7', '15,6', '11,2', '10,2'] },
  { id: 'salamandra', color: '#84cc16', chain: ['14,8', '14,7', '14,6', '11,3', '10,3'] },

  // ── OLA 2: tips al otro lado de la arista — el rayo cruza el pliegue ──
  { id: 'trasgo', color: '#fb7185', chain: ['21,8', '21,7', '21,6'] },
  { id: 'lombriz', color: '#14b8a6', chain: ['20,8', '20,7', '20,6'] },
  { id: 'pez', color: '#a855f7', chain: ['8,8', '8,7', '8,6'] },
  { id: 'medusa', color: '#ef4444', chain: ['11,8', '10,8', '10,7', '9,7', '9,6'] },
  { id: 'ballena', color: '#3b82f6', chain: ['0,10', '0,9', '1,9', '1,8', '2,8', '2,7'] },
  { id: 'morena', color: '#22c55e', chain: ['4,9', '4,8', '3,8', '3,7'] },
  { id: 'fenix', color: '#f97316', chain: ['17,10', '17,9', '16,9', '15,9', '15,8'] },
  { id: 'kraken', color: '#ec4899', chain: ['12,8', '12,9', '13,9', '13,10', '14,10', '14,9'] },

  // ── OLA 3: lo profundo de los carriles laterales ──
  { id: 'golem', color: '#8b5cf6', chain: ['22,11', '22,10', '21,10', '21,9'] },
  { id: 'basilisco', color: '#06b6d4', chain: ['18,11', '18,10', '19,10', '20,10', '20,9'] },
  { id: 'tortuga', color: '#f59e0b', chain: ['6,11', '7,11', '7,10', '8,10', '8,9'] },
  { id: 'hidra', color: '#84cc16', chain: ['11,10', '11,9', '10,9', '9,9', '9,8'] },
  { id: 'foca', color: '#fb7185', chain: ['2,11', '2,10', '2,9'] },
  { id: 'pulpo', color: '#14b8a6', chain: ['5,10', '4,10', '4,11', '3,11', '3,10', '3,9'] },
  { id: 'quimera', color: '#a855f7', chain: ['16,11', '15,11', '15,10'] },
  // Entra desde ABAJO: su rayo sube la cara derecha y cruza dos aristas.
  { id: 'gargola', color: '#ef4444', chain: ['11,15', '11,14', '14,11'] },

  // ── OLA 4: la cara de ABAJO — rayos que cruzan DOS aristas y recorren el
  //    carril completo (columna trasera o frontal + cara de arriba) ──
  { id: 'leviatan', color: '#3b82f6', chain: ['6,16', '6,17', '7,17', '7,16', '8,16', '8,17'] },
  { id: 'fantasma', color: '#22c55e', chain: ['11,17', '11,16', '10,16', '9,16', '9,17'] },
  { id: 'espectro', color: '#f97316', chain: ['6,13', '6,12', '7,12', '7,13', '8,13', '8,12'] },
  { id: 'wyvern', color: '#ec4899', chain: ['11,12', '11,13', '10,13', '9,13', '9,12'] },
];

/**
 * Secuencia ganadora por olas: cada carril se vacía de adentro hacia afuera.
 * Cada tap termina en 'destroyed'; 24 taps = WON.
 */
export const EL_HUECO_SOLVE_ORDER: string[] = [
  'anguila', 'sierpe', 'caracol', 'dragon', 'orca', 'vibora', 'grifo', 'salamandra',
  'trasgo', 'lombriz', 'pez', 'medusa', 'ballena', 'morena', 'fenix', 'kraken',
  'golem', 'basilisco', 'tortuga', 'hidra', 'foca', 'pulpo', 'quimera', 'gargola',
  'leviatan', 'fantasma', 'espectro', 'wyvern',
];

function buildScene(): Scene {
  const topo = buildCubeTopology(S);
  const holes = new Set(HOLE_CELL_IDS);

  // Puerto de salida entre celdas vecinas, derivado del grafo real.
  const portTo = new Map<string, number>();
  for (const c of topo.connections) {
    portTo.set(`${c.fromCell}|${c.toCell}`, c.fromPort);
    portTo.set(`${c.toCell}|${c.fromCell}`, c.toPort);
  }

  const occupied = new Set<string>();
  const arrows: SceneArrow[] = SNAKES.map(({ id, color, chain }) => {
    for (let k = 0; k < chain.length - 1; k++) {
      if (!portTo.has(`${chain[k]}|${chain[k + 1]}`)) {
        throw new Error(`EL HUECO: cadena rota en ${id}: ${chain[k]} → ${chain[k + 1]}`);
      }
    }
    for (const cellId of chain) {
      if (holes.has(cellId)) {
        throw new Error(`EL HUECO: ${id} pisa el agujero en ${cellId}`);
      }
      if (occupied.has(cellId)) {
        throw new Error(`EL HUECO: ${id} solapa la celda ${cellId}`);
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
    id: 'el-hueco',
    name: 'El Hueco',
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

export const LEVEL_EL_HUECO: Scene = buildScene();
