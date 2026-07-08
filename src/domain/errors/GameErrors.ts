export class NoMovesRemainingError extends Error {
  constructor() {
    super('NoMovesRemainingError: no moves remaining in this session');
    this.name = 'NoMovesRemainingError';
  }
}

export class GameAlreadyFinishedError extends Error {
  constructor(status: 'WON' | 'LOST') {
    super(`Game already ${status}`);
    this.name = 'GameAlreadyFinishedError';
  }
}
