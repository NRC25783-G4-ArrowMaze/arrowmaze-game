import { Direction } from '../../domain/entities/Direction';
import { Position } from '../../domain/value-objects/Position';

export interface MovePlayerRequest {
  playerPosition: Position;
  rotationDirection: 'CW' | 'CCW'; // Clockwise or Counter-clockwise
}

export interface MovePlayerResult {
  success: boolean;
  newPosition: Position;
  newDirection?: Direction;
  error?: string;
}

export interface CompleteLevelResult {
  levelCompleted: boolean;
  score?: {
    points: number;
    moves: number;
    time: number;
  };
  error?: string;
}

export interface LoadLevelResult {
  success: boolean;
  levelId: string;
  gridWidth: number;
  gridHeight: number;
  initialPlayer: Position;
  cells: {
    position: Position;
    direction: Direction;
    type: string;
  }[];
  error?: string;
}
