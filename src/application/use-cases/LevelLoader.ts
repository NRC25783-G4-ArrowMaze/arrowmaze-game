import { type IBoardBuilder } from '../ports/IBoardBuilder';
import { type IArrowBuilder } from '../ports/IArrowBuilder';
import type { LevelDataDTO } from '../../infrastructure/shared/contracts/LevelDataDTOs';
import { Board } from '../../domain/entities/Board';
import { Arrow } from '../../domain/entities/Arrow';

export interface LoadedLevel {
  board: Board;
  arrows: Arrow[];
}

export class LevelLoader {
  private readonly boardBuilder: IBoardBuilder;
  private readonly arrowBuilder: IArrowBuilder;

  constructor(boardBuilder: IBoardBuilder, arrowBuilder: IArrowBuilder) {
    this.boardBuilder = boardBuilder;
    this.arrowBuilder = arrowBuilder;
  }

  public load(data: LevelDataDTO): LoadedLevel {
    // 1. Construir la infraestructura pasiva (El escenario)
    const board = this.boardBuilder.build(data);

    // 2. Construir las entidades activas usando el escenario (Los actores)
    const arrows = this.arrowBuilder.buildAll(board, data.arrows);

    // 3. Entregar el estado inicial completo del nivel
    return { board, arrows };
  }
}