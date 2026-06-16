import { type IArrowBuilder } from '../ports/IArrowBuilder';
import { Board } from '../../domain/entities/Board';
import { Arrow } from '../../domain/entities/Arrow';
import type { LevelArrowDTO } from '../../infrastructure/shared/contracts/LevelDataDTOs';
import { BoardRegistryError } from '../../domain/errors/BoardErrors';

export class LevelDataArrowBuilder implements IArrowBuilder {
  
  public buildAll(board: Board, arrowDTOs: LevelArrowDTO[]): Arrow[] {
    const arrows: Arrow[] = [];

    for (const arrowData of arrowDTOs) {
      // Garantizado por el IBoardBuilder que estas celdas existen
      const headCell = board.getCell(arrowData.head.cellId);
      
      if (!headCell) {
        throw new BoardRegistryError(`Cannot spawn arrow ${arrowData.id}: head cell "${arrowData.head.cellId}" not found in board`);
      }

      const arrow = new Arrow(headCell, arrowData.head.exitPort);

      for (const bodyCellId of arrowData.body) {
        const bodyCell = board.getCell(bodyCellId);
        
        if(!bodyCell){
            throw new BoardRegistryError(`Cannot spawn arrow ${arrowData.id}: body cell "${bodyCellId}" not found in board`);
        }

        // Delega la validación de conectividad y colisión al Dominio
        arrow.extend(bodyCell);
      }

      arrows.push(arrow);
    }

    return arrows;
  }
}