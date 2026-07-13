/**
 * viewModel — Tipos del VIEW-MODEL de presentación del tablero.
 *
 * Viven en un módulo `.ts` (no en el componente `.tsx`) para que la capa de
 * aplicación de presentación (GameController) y los tests puedan importarlos sin
 * arrastrar JSX. Modelan los datos posicionales (col/row) y cromáticos (color)
 * que el dominio NO conoce; un adapter externo los ensambla.
 */

/** Celda con su posición de rejilla para el renderizado. */
export interface CellView {
  id: string
  col: number
  row: number
  layer?: number
}

/** Flecha lista para renderizar: color y celdas ocupadas en orden. */
export interface ArrowView {
  id: string;
  /** Color CSS de la flecha (cuerpo + cabeza). */
  color: string;
  /** IDs de celdas ocupadas en orden de ocupación; el índice 0 es la cabeza. */
  cellIds: string[];
  /** Puerto de salida de la cabeza (define la dirección del apex). */
  exitDir: number;
}

/** View-model completo del tablero para la capa de presentación. */
export interface BoardViewModel {
  cells: CellView[];
  arrows: ArrowView[];
}
