import { Cell } from './Cell';
import { Position } from '../value-objects/Position';

export class Board {
  private cells: Map<string, Cell> = new Map();
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error('Board dimensions must be positive');
    }
    this.width = width;
    this.height = height;
  }

  setCell(cell: Cell): void {
    const key = this.getKey(cell.getPosition());
    this.cells.set(key, cell);
  }

  getCell(position: Position): Cell | undefined {
    const key = this.getKey(position);
    return this.cells.get(key);
  }

  getAllCells(): Cell[] {
    return Array.from(this.cells.values());
  }

  isWithinBounds(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < this.width &&
      position.y >= 0 &&
      position.y < this.height
    );
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  private getKey(position: Position): string {
    return `${position.x},${position.y}`;
  }
}
