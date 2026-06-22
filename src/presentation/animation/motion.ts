import { portDelta } from '../rendering/boardLayout';
import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';

/**
 * motion — Plan de animación PURO para un tick (B2).
 *
 * Traduce el outcome de un tick (advanced | blocked | destroyed) a un vector de
 * movimiento en píxeles y una duración, usando el mapeo puerto→dirección de B1.
 * NO toca el dominio ni el DOM: solo aritmética. La capa visual (ArrowComponent)
 * interpreta este plan; desactivar las animaciones no cambia el estado del motor.
 */

/** Tipo de coreografía visual asociada a cada outcome. */
export type ArrowMotionKind = 'glide' | 'recoil' | 'fade';

/** Plan de movimiento de UNA flecha durante la ventana de animación. */
export interface ArrowMotion {
  kind: ArrowMotionKind;
  /** Vector de desplazamiento en píxeles (eje x pantalla). */
  dx: number;
  /** Vector de desplazamiento en píxeles (eje y pantalla). */
  dy: number;
  /** Duración de la ventana de animación en milisegundos. */
  durationMs: number;
}

// ── Constantes de timing/forma (ajustables sin tocar la lógica) ──
export const GLIDE_MS = 180;
export const RECOIL_MS = 220;
export const FADE_MS = 260;
/** Fracción de cellSize que la cabeza se empuja en el recoil antes de regresar. */
export const RECOIL_FRACTION = 0.28;

/**
 * Construye el plan de movimiento para un tick.
 *
 * - advanced:  glide de UNA celda completa en dirección del exitPort.
 * - blocked:   recoil — empuje de una fracción de celda hacia el exitPort (y vuelta).
 * - destroyed: fade — deriva de una celda en dirección del exitPort mientras desvanece.
 *
 * @param outcome - Resultado del tick devuelto por el motor.
 * @param exitDir - Puerto de salida de la cabeza ANTES del tick (dirección de avance).
 * @param cellSize - Tamaño de celda en píxeles.
 */
export function buildArrowMotion(
  outcome: AdvanceOutcome,
  exitDir: number,
  cellSize: number,
): ArrowMotion {
  const { dCol, dRow } = portDelta(exitDir);
  const cx = dCol * cellSize;
  const cy = dRow * cellSize;

  switch (outcome) {
    case 'advanced':
      return { kind: 'glide', dx: cx, dy: cy, durationMs: GLIDE_MS };
    case 'blocked':
      return {
        kind: 'recoil',
        dx: cx * RECOIL_FRACTION,
        dy: cy * RECOIL_FRACTION,
        durationMs: RECOIL_MS,
      };
    case 'destroyed':
      return { kind: 'fade', dx: cx, dy: cy, durationMs: FADE_MS };
  }
}
