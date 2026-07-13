import type { LevelMapDTO } from '../../application/dtos/LevelMapDTOs';

/**
 * LEVEL_MAP — progresión LINEAL del distribuible.
 *
 * El primer nivel (`level-initial`) es el TUTORIAL guiado. El mapa preview con
 * forma de corazón (`heart-preview`) es el ÚLTIMO nivel. Cada nodo desbloquea al
 * siguiente en cadena (sin ramas):
 * initial → A → B → advanced → expert → mapas 6-15 → heart.
 *
 * `pathHint` no gobierna el layout (LevelSelectScreen dibuja un grid por el orden
 * del array); se conserva por compatibilidad del contrato C3.
 */
export const LEVEL_MAP: LevelMapDTO = [
  {
    levelId: 'level-initial',
    prerequisites: [],
    pathHint: { x: 50, y: 10 },
    starThresholds: [2000, 3000],
  },
  {
    levelId: 'level-intermediate-a',
    prerequisites: ['level-initial'],
    pathHint: { x: 50, y: 26 },
    starThresholds: [2500, 3500],
  },
  {
    levelId: 'level-intermediate-b',
    prerequisites: ['level-intermediate-a'],
    pathHint: { x: 50, y: 42 },
    starThresholds: [2200, 3200],
  },
  {
    levelId: 'level-advanced',
    prerequisites: ['level-intermediate-b'],
    pathHint: { x: 50, y: 58 },
    starThresholds: [3000, 4000],
  },
  {
    levelId: 'level-expert',
    prerequisites: ['level-advanced'],
    pathHint: { x: 50, y: 74 },
    starThresholds: [3500, 4500],
  },
  // Mapas 6-15: 5 medios (6-10) y 5 difíciles (11-15); borradores para el
  // FORGE registrados también en el seed del backend (misma definición).
  {
    levelId: 'mapa-06',
    prerequisites: ['level-expert'],
    pathHint: { x: 50, y: 76 },
    starThresholds: [2500, 3500],
  },
  {
    levelId: 'mapa-07',
    prerequisites: ['mapa-06'],
    pathHint: { x: 50, y: 78 },
    starThresholds: [2500, 3500],
  },
  {
    levelId: 'mapa-08',
    prerequisites: ['mapa-07'],
    pathHint: { x: 50, y: 80 },
    starThresholds: [2500, 3500],
  },
  {
    levelId: 'mapa-09',
    prerequisites: ['mapa-08'],
    pathHint: { x: 50, y: 82 },
    starThresholds: [2500, 3500],
  },
  {
    levelId: 'mapa-10',
    prerequisites: ['mapa-09'],
    pathHint: { x: 50, y: 84 },
    starThresholds: [2500, 3500],
  },
  {
    levelId: 'mapa-11',
    prerequisites: ['mapa-10'],
    pathHint: { x: 50, y: 86 },
    starThresholds: [3500, 4500],
  },
  {
    levelId: 'mapa-12',
    prerequisites: ['mapa-11'],
    pathHint: { x: 50, y: 88 },
    starThresholds: [3500, 4500],
  },
  {
    levelId: 'mapa-13',
    prerequisites: ['mapa-12'],
    pathHint: { x: 50, y: 90 },
    starThresholds: [3500, 4500],
  },
  {
    levelId: 'mapa-14',
    prerequisites: ['mapa-13'],
    pathHint: { x: 50, y: 92 },
    starThresholds: [3500, 4500],
  },
  {
    levelId: 'mapa-15',
    prerequisites: ['mapa-14'],
    pathHint: { x: 50, y: 94 },
    starThresholds: [3500, 4500],
  },
  {
    levelId: 'heart-preview',
    prerequisites: ['mapa-15'],
    pathHint: { x: 50, y: 96 },
    starThresholds: [2000, 3000],
  },
  // SINGULARIDAD — el GRAN FINAL original. Ahora va ANTES de Cube.
  {
    levelId: 'singularidad',
    prerequisites: ['heart-preview'],
    pathHint: { x: 50, y: 98 },
    starThresholds: [1253, 1400],
  },
  // CUBE — El nuevo desafío 3D
  {
    levelId: 'cube',
    prerequisites: ['singularidad'],
    pathHint: { x: 50, y: 100 },
    starThresholds: [1500, 2000],
  },
];
