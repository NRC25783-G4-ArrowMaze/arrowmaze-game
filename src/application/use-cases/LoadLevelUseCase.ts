import { ILevelRepository } from '../../application/ports/ILevelRepository';
import { LoadLevelResult } from '../dtos/GameDTOs';
import { Board } from '../../domain/entities/Board';
import { Cell, CellType } from '../../domain/entities/Cell';
import { Direction } from '../../domain/entities/Direction';
import { Position } from '../../domain/value-objects/Position';

export class LoadLevelUseCase {
  constructor(private levelRepository: ILevelRepository) {}

  async execute(levelId: string): Promise<LoadLevelResult> {
    try {
      const level = await this.levelRepository.getLevel(levelId);

      // Create board
      const board = new Board(level.getGridWidth(), level.getGridHeight());

      // For now, create a simple grid with arrows pointing right
      // In a real scenario, this would come from a JSON config file
      const cells = [];
      for (let y = 0; y < level.getGridHeight(); y++) {
        for (let x = 0; x < level.getGridWidth(); x++) {
          const position = new Position(x, y);
          let cellType = CellType.NORMAL;

          // Set starting position
          if (x === 0 && y === 0) {
            cellType = CellType.NORMAL;
          }
          // Set exit
          if (
            x === level.getGridWidth() - 1 &&
            y === level.getGridHeight() - 1
          ) {
            cellType = CellType.EXIT;
          }

          const cell = new Cell(
            position,
            Direction.RIGHT,
            cellType
          );
          board.setCell(cell);

          cells.push({
            position,
            direction: cell.getDirection(),
            type: cellType,
          });
        }
      }

      return {
        success: true,
        levelId: level.getId(),
        gridWidth: level.getGridWidth(),
        gridHeight: level.getGridHeight(),
        initialPlayer: new Position(0, 0),
        cells: cells as any,
      };
    } catch (error) {
      return {
        success: false,
        levelId,
        gridWidth: 0,
        gridHeight: 0,
        initialPlayer: new Position(0, 0),
        cells: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
