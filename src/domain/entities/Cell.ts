import { Direction } from './Direction';
import { Position } from '../value-objects/Position';

export enum CellType {
  NORMAL = 'NORMAL',
  WALL = 'WALL',
  EXIT = 'EXIT',
}

export class Cell {
  private direction: Direction;
  private readonly position: Position;
  private readonly type: CellType;
  private readonly isTraversable: boolean;

  constructor(
    position: Position,
    direction: Direction,
    type: CellType = CellType.NORMAL,
    isTraversable: boolean = true
  ) {
    this.position = position;
    this.direction = direction;
    this.type = type;
    this.isTraversable = isTraversable;
  }

  getPosition(): Position {
    return this.position;
  }

  getDirection(): Direction {
    return this.direction;
  }

  setDirection(direction: Direction): void {
    this.direction = direction;
  }

  getType(): CellType {
    return this.type;
  }

  canTraverse(): boolean {
    return this.isTraversable && this.type !== CellType.WALL;
  }

  isExit(): boolean {
    return this.type === CellType.EXIT;
  }
}
