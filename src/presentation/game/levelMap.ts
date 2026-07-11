import type { LevelMapDTO } from '../../application/dtos/LevelMapDTOs';

/**
 * LEVEL_MAP — progresión LINEAL del distribuible.
 *
 * El primer nivel (`level-initial`) es el TUTORIAL guiado. El mapa preview con
 * forma de corazón (`heart-preview`) es el ÚLTIMO nivel. Cada nodo desbloquea al
 * siguiente en cadena (sin ramas):
 * initial → A → B → advanced → expert → heart.
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
  {
    levelId: 'heart-preview',
    prerequisites: ['level-expert'],
    pathHint: { x: 50, y: 90 },
    starThresholds: [2000, 3000],
  },
];
