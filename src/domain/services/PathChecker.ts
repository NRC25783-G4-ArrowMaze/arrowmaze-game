import { Board } from '../entities/Board';
import { Cell } from '../entities/Cell';
import { Position } from '../value-objects/Position';
import { Direction } from '../entities/Direction';

export class PathChecker {
  /**
   * Verifica si un camino desde una celda alcanza la salida siguiendo las flechas
   */
  static canReachExit(board: Board, startCell: Cell): boolean {
    const visited = new Set<string>();
    const queue: Cell[] = [startCell];

    while (queue.length > 0) {
      const cell = queue.shift()!;
      const key = this.getKey(cell.getPosition());

      if (visited.has(key)) continue;
      visited.add(key);

      if (cell.isExit()) {
        return true;
      }

      const nextPosition = this.getNextPosition(
        cell.getPosition(),
        cell.getDirection()
      );

      if (board.isWithinBounds(nextPosition)) {
        const nextCell = board.getCell(nextPosition);
        if (nextCell && nextCell.canTraverse()) {
          queue.push(nextCell);
        }
      }
    }

    return false;
  }

  /**
   * Obtiene la siguiente posición basada en la dirección actual
   */
  private static getNextPosition(position: Position, direction: Direction): Position {
    switch (direction) {
      case Direction.UP:
        return new Position(position.x, position.y - 1);
      case Direction.DOWN:
        return new Position(position.x, position.y + 1);
      case Direction.LEFT:
        return new Position(position.x - 1, position.y);
      case Direction.RIGHT:
        return new Position(position.x + 1, position.y);
    }
  }

  private static getKey(position: Position): string {
    return `${position.x},${position.y}`;
  }
}
