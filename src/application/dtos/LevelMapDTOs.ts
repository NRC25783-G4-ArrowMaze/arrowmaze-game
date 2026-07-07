export interface LevelMapNodeDTO {
  levelId: string;
  prerequisites: string[];
  pathHint?: { x: number; y: number };
  starThresholds?: [number, number];
}

export type LevelMapDTO = LevelMapNodeDTO[];
