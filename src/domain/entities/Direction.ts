export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export function rotateClockwise(direction: Direction): Direction {
  const rotations = {
    [Direction.UP]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.DOWN,
    [Direction.DOWN]: Direction.LEFT,
    [Direction.LEFT]: Direction.UP,
  };
  return rotations[direction];
}

export function rotateCounterClockwise(direction: Direction): Direction {
  const rotations = {
    [Direction.UP]: Direction.LEFT,
    [Direction.LEFT]: Direction.DOWN,
    [Direction.DOWN]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.UP,
  };
  return rotations[direction];
}
