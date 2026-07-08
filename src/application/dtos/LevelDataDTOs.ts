export interface LevelCellDTO {
  id: string;
  portCount: number;
}

export interface LevelConnectionDTO {
  fromCell: string;
  fromPort: number;
  toCell: string;
  toPort: number;
}

export interface LevelArrowDTO {
  id: string;
  head: {
    cellId: string;
    exitPort: number;
  };
  body: string[]; 
}

export interface LevelDataDTO {
  id: string;
  name?: string;
  difficulty?: string;
  allowedMoves: number;
  arrows: LevelArrowDTO[];
  cells: LevelCellDTO[];
  connections?: LevelConnectionDTO[];
}