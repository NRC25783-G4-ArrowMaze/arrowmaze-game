import type { LevelMapDTO } from '../../application/dtos/LevelMapDTOs';

export const LEVEL_MAP: LevelMapDTO = [
  {
    levelId: 'level-initial',
    prerequisites: [],
    pathHint: { x: 50, y: 20 },
    starThresholds: [2000, 3000],
  },
  {
    levelId: 'level-intermediate-a',
    prerequisites: ['level-initial'],
    pathHint: { x: 20, y: 50 },
    starThresholds: [2500, 3500],
  },
  {
    levelId: 'level-intermediate-b',
    prerequisites: ['level-initial'],
    pathHint: { x: 80, y: 50 },
    starThresholds: [2200, 3200],
  },
  {
    levelId: 'level-advanced',
    prerequisites: ['level-intermediate-a', 'level-intermediate-b'],
    pathHint: { x: 50, y: 80 },
    starThresholds: [3000, 4000],
  },
  {
    levelId: 'level-expert',
    prerequisites: ['level-advanced'],
    pathHint: { x: 50, y: 100 },
  },
];
