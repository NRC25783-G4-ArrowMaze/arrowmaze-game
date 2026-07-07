export class TopologyError extends Error {
  constructor(message: string) {
    super(`TopologyError: ${message}`);
    this.name = 'TopologyError';
  }
}

export class BoardRegistryError extends Error {
  constructor(message: string) {
    super(`BoardRegistryError: ${message}`);
    this.name = 'BoardRegistryError';
  }
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(`ConnectionError: ${message}`);
    this.name = 'ConnectionError';
  }
}

export class LevelDataError extends Error {
  constructor(message: string) {
    super(`LevelDataError: ${message}`);
    this.name = 'LevelDataError';
  }
}

export class BoardMutationError extends Error {
  constructor(message: string) {
    super(`BoardMutationError: ${message}`);
    this.name = 'BoardMutationError';
  }
}