/**
 * ArrowPlacementError — thrown by Arrow when a structural constraint is violated
 * during segment placement (connectivity, occupancy, self-collision, init order).
 */
export class ArrowPlacementError extends Error {
  constructor(message: string) {
    super(`ArrowPlacementError: ${message}`);
    this.name = 'ArrowPlacementError';
  }
}

/**
 * ArrowCreationError — thrown by Arrow constructor when creation preconditions
 * are violated (e.g. missing exitPort intent on head segment).
 */
export class ArrowCreationError extends Error {
  constructor(message: string) {
    super(`ArrowCreationError: ${message}`);
    this.name = 'ArrowCreationError';
  }
}

/**
 * ArrowCinematicError — thrown when external code attempts to mutate the arrow's
 * segment chain while an in-flight transaction is active.
 *
 * Scenarios:
 * - Arrow.extend() called while inFlight === true
 * - Arrow.destroy() called partially while inFlight === true
 */
export class ArrowCinematicError extends Error {
  constructor(message: string) {
    super(`ArrowCinematicError: ${message}`);
    this.name = 'ArrowCinematicError';
  }
}
