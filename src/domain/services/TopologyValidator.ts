import { Cell } from '../entities/Cell';

/**
 * TopologyValidator - Static domain service for validating graph topology constraints.
 *
 * All methods are pure validators — they throw on violation, return void on success.
 * They contain NO mutation side-effects.
 */
export class TopologyValidator {
  /**
   * Validates that the port count is a positive even integer.
   * Throws: 'TopologyError: port count must be an even number'
   */
  static validateEvenPortCount(portCount: number): void {
    if (!Number.isInteger(portCount) || portCount <= 0 || portCount % 2 !== 0) {
      throw new Error('TopologyError: port count must be an even number');
    }
  }

  /**
   * Validates that a port index is in the valid range [0, portCount - 1].
   * Throws: 'TopologyError: port index out of range'
   */
  static validatePortIndex(portIndex: number, portCount: number): void {
    if (!Number.isInteger(portIndex) || portIndex < 0 || portIndex >= portCount) {
      throw new Error('TopologyError: port index out of range');
    }
  }

  /**
   * Validates that a cell is not trying to connect to itself.
   * Throws: 'ConnectionError: a cell cannot connect to itself'
   */
  static validateNoSelfConnect(cellA: Cell, cellB: Cell): void {
    if (cellA === cellB) {
      throw new Error('ConnectionError: a cell cannot connect to itself');
    }
  }
}
