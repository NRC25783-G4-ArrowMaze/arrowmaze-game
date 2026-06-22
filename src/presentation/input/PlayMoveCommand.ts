/**
 * PlayMoveCommand — Intención de jugada emitida por la capa de input (B3).
 *
 * Es un comando deliberadamente mínimo: identifica QUÉ flecha quiere mover el
 * jugador, nada más. El adaptador de input NO evalúa colisiones ni reglas; eso
 * lo decide el motor (PlayMoveUseCase → AdvanceArrowUseCase). El comando es el
 * único puente entre "el jugador tocó esta flecha" y "ejecuta un tick".
 */
export interface PlayMoveCommand {
  /** Id de la flecha que ocupa la celda tocada. */
  arrowId: string;
}
