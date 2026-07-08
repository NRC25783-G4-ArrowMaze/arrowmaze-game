/**
 * AdvanceOutcome — The three terminal states of a single advance tick.
 *
 * - 'advanced'  : The arrow moved forward one position successfully.
 * - 'blocked'   : The head's target cell was occupied by a foreign entity.
 *                 The arrow performed a full rollback; its state is unchanged.
 * - 'destroyed' : The head reached an exit port (sink). The arrow released
 *                 all its cells and self-destructed.
 */
export type AdvanceOutcome = 'advanced' | 'blocked' | 'destroyed';

/**
 * AdvanceResult — Domain value object returned by Arrow.advance().
 *
 * Encapsulates what happened during a single movement tick:
 * - outcome: The result of the tick (advanced, blocked, or destroyed).
 * - freedCellIds: IDs of cells that were released during this tick.
 * - occupiedCellIds: IDs of cells that were newly claimed during this tick.
 *
 * Invariants:
 * - On 'blocked':   freedCellIds and occupiedCellIds are both empty (rollback = no mutation).
 * - On 'destroyed': freedCellIds contains all cells the arrow previously occupied.
 *                   occupiedCellIds is empty (arrow is gone).
 * - On 'advanced':  exactly 1 cell occupied (new head position),
 *                   at least 1 cell freed (old tail position).
 */
export interface AdvanceResult {
  readonly outcome: AdvanceOutcome;
  readonly freedCellIds: readonly string[];
  readonly occupiedCellIds: readonly string[];
}
