import type { LevelMapDTO } from '../../application/dtos/LevelMapDTOs';

/**
 * LEVEL_MAP — progresión LINEAL del distribuible.
 *
 * El primer nivel (`level-initial`) es el TUTORIAL guiado. El mapa preview con
 * forma de corazón (`heart-preview`) se juega como 3.º nivel. Cada nodo desbloquea
 * al siguiente en cadena (sin ramas): initial → A → heart → B → advanced → expert.
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
    pathHint: { x: 50, y: 28 },
    starThresholds: [2500, 3500],
  },
  {
    levelId: 'heart-preview',
    prerequisites: ['level-intermediate-a'],
    pathHint: { x: 50, y: 46 },
    starThresholds: [2000, 3000],
  },
  {
    levelId: 'level-intermediate-b',
    prerequisites: ['heart-preview'],
    pathHint: { x: 50, y: 64 },
    starThresholds: [2200, 3200],
  },
  {
    levelId: 'level-advanced',
    prerequisites: ['level-intermediate-b'],
    pathHint: { x: 50, y: 82 },
    starThresholds: [3000, 4000],
  },
  {
    levelId: 'level-expert',
    prerequisites: ['level-advanced'],
    pathHint: { x: 50, y: 100 },
  },
];
