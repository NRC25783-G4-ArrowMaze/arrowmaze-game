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
  /**
   * Modo del nivel. Ausente = '2d'. En '3d' y 'cube' la topología deja de ser
   * una rejilla plana, por lo que el builder omite la comprobación geométrica
   * de puertos opuestos (el dominio sigue validando rango/libres/no-auto).
   */
  mapMode?: '2d' | '3d' | 'cube';
  allowedMoves: number;
  arrows: LevelArrowDTO[];
  cells: LevelCellDTO[];
  connections?: LevelConnectionDTO[];
  collisionBehavior?: 'stay' | 'return';
}