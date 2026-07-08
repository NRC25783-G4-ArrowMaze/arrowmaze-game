export class InvalidLevelProgressError extends Error {
  constructor(detail: string) {
    super(`InvalidLevelProgressError: ${detail}`);
    this.name = 'InvalidLevelProgressError';
  }
}
